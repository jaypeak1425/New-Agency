import { prisma } from "@/lib/prisma";
import { PER_AVATAR_ANNUAL_COMMISSION } from "@/lib/book-of-business";
import type {
  Avatar,
  NetWorthEstimate,
  QualifiedFundsEstimate,
  User,
} from "@/generated/prisma/client";

// Book-of-business import + scoring (docs/07 section 4 made real): the
// agent's actual client list becomes ranked opportunities. Deterministic
// end to end — CSV parsing is tolerant about headers and value formats but
// never guesses a value it can't read; classification mirrors the avatar
// engine's thresholds (docs/03 section 3); scoring uses the locked
// per-avatar Y1 commission model. A client the fields can't classify gets
// avatar null and score 0, honestly.

export class BookImportError extends Error {}

export const MAX_IMPORT_ROWS = 2_000;

export interface ParsedBookRow {
  name: string;
  age: number | null;
  businessOwner: boolean | null;
  hasCoOwners: boolean | null;
  netWorthEstimate: NetWorthEstimate | null;
  qualifiedFundsEstimate: QualifiedFundsEstimate | null;
  hasDependentsUnder18: boolean | null;
  notes: string | null;
}

export interface BookCsvParseResult {
  rows: ParsedBookRow[];
  // 1-indexed data-row numbers that were skipped, with the reason.
  skipped: Array<{ row: number; reason: string }>;
}

// Header synonyms → canonical field. Matching is case/space/punctuation
// insensitive ("Net Worth", "net_worth", "networth" all match).
const HEADER_MAP: Array<[keyof ParsedBookRow, string[]]> = [
  ["name", ["name", "client", "clientname", "fullname"]],
  ["age", ["age"]],
  ["businessOwner", ["businessowner", "owner", "business", "isowner"]],
  ["hasCoOwners", ["coowners", "cowners", "partners", "hascoowners"]],
  ["netWorthEstimate", ["networth", "networthestimate", "nw", "estimatednetworth"]],
  [
    "qualifiedFundsEstimate",
    ["qualified", "qualifiedfunds", "ira", "401k", "retirementfunds", "qualifiedbalance"],
  ],
  ["hasDependentsUnder18", ["dependents", "kids", "children", "minorchildren"]],
  ["notes", ["notes", "note", "comments", "detail", "details"]],
];

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

function parseBoolean(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (["y", "yes", "true", "1", "owner"].includes(v)) return true;
  if (["n", "no", "false", "0"].includes(v)) return false;
  return null;
}

// Accepts "$2,500,000", "2.5m", "750k", "1200000", or band words.
function parseDollars(raw: string): number | null {
  const v = raw.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!v) return null;
  const m = v.match(/^(\d+(?:\.\d+)?)(m|mm|k)?$/);
  if (!m) return null;
  const base = Number(m[1]);
  if (!Number.isFinite(base)) return null;
  const mult = m[2] === "k" ? 1_000 : m[2] ? 1_000_000 : 1;
  return Math.round(base * mult);
}

function parseNetWorth(raw: string): NetWorthEstimate | null {
  const dollars = parseDollars(raw);
  if (dollars !== null) {
    if (dollars >= 5_000_000) return "over_5m";
    if (dollars >= 2_000_000) return "range_2m_5m";
    if (dollars >= 500_000) return "range_500k_2m";
    return "under_500k";
  }
  const v = normalizeHeader(raw);
  if (["over5m", "5mplus"].includes(v)) return "over_5m";
  if (["range2m5m", "2m5m"].includes(v)) return "range_2m_5m";
  if (["range500k2m", "500k2m"].includes(v)) return "range_500k_2m";
  if (["under500k"].includes(v)) return "under_500k";
  return null;
}

function parseQualified(raw: string): QualifiedFundsEstimate | null {
  const dollars = parseDollars(raw);
  if (dollars !== null) return dollars >= 500_000 ? "over_500k" : "under_500k";
  const bool = parseBoolean(raw);
  if (bool !== null) return bool ? "over_500k" : "under_500k";
  const v = normalizeHeader(raw);
  if (v === "over500k") return "over_500k";
  if (v === "under500k") return "under_500k";
  return null;
}

// Minimal RFC-4180-ish line splitter: handles quoted cells with embedded
// commas and doubled quotes; no multi-line cells (book exports don't need
// them, and rejecting keeps the parser predictable).
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export function parseBookCsv(text: string): BookCsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new BookImportError(
      "That file needs a header row and at least one client row (columns like: name, age, business owner, co-owners, net worth, qualified funds, dependents, notes).",
    );
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const columnFor = new Map<number, keyof ParsedBookRow>();
  for (const [field, synonyms] of HEADER_MAP) {
    const index = headers.findIndex((h) => synonyms.includes(h));
    if (index >= 0) columnFor.set(index, field);
  }
  if (![...columnFor.values()].includes("name")) {
    throw new BookImportError(
      'No name column found — the header row needs a "name" (or "client") column.',
    );
  }

  const dataLines = lines.slice(1);
  if (dataLines.length > MAX_IMPORT_ROWS) {
    throw new BookImportError(
      `That's ${dataLines.length.toLocaleString()} rows — the import caps at ${MAX_IMPORT_ROWS.toLocaleString()} per file. Split the file and import in batches.`,
    );
  }

  const rows: ParsedBookRow[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  dataLines.forEach((line, i) => {
    const cells = splitCsvLine(line);
    const row: ParsedBookRow = {
      name: "",
      age: null,
      businessOwner: null,
      hasCoOwners: null,
      netWorthEstimate: null,
      qualifiedFundsEstimate: null,
      hasDependentsUnder18: null,
      notes: null,
    };
    for (const [index, field] of columnFor) {
      const raw = (cells[index] ?? "").trim();
      if (!raw) continue;
      switch (field) {
        case "name":
          row.name = raw.slice(0, 200);
          break;
        case "age": {
          const age = Number(raw);
          if (Number.isInteger(age) && age >= 0 && age <= 120) row.age = age;
          break;
        }
        case "businessOwner":
          row.businessOwner = parseBoolean(raw);
          break;
        case "hasCoOwners":
          row.hasCoOwners = parseBoolean(raw);
          break;
        case "netWorthEstimate":
          row.netWorthEstimate = parseNetWorth(raw);
          break;
        case "qualifiedFundsEstimate":
          row.qualifiedFundsEstimate = parseQualified(raw);
          break;
        case "hasDependentsUnder18":
          row.hasDependentsUnder18 = parseBoolean(raw);
          break;
        case "notes":
          row.notes = raw.slice(0, 2000);
          break;
      }
    }
    if (!row.name) {
      skipped.push({ row: i + 1, reason: "no name" });
      return;
    }
    rows.push(row);
  });

  return { rows, skipped };
}

// Classification mirrors the avatar engine's thresholds (docs/03 section 3),
// resolved to the single best avatar by CLAUDE.md's priority order
// BO → HNW → QFH → Family/Legacy; scoring per docs/07 section 4.
export function scoreBookClient(row: ParsedBookRow): { avatar: Avatar | null; scoreY1: number } {
  if (row.businessOwner === true) {
    return {
      avatar: "business_owner",
      scoreY1:
        row.hasCoOwners === true
          ? PER_AVATAR_ANNUAL_COMMISSION.businessOwnersWithCoOwners
          : PER_AVATAR_ANNUAL_COMMISSION.businessOwnersSolo,
    };
  }
  if (row.netWorthEstimate === "over_5m" || row.netWorthEstimate === "range_2m_5m") {
    return { avatar: "high_net_worth", scoreY1: PER_AVATAR_ANNUAL_COMMISSION.hnwIndividuals };
  }
  if (row.qualifiedFundsEstimate === "over_500k") {
    return {
      avatar: "qualified_fund_heavy",
      scoreY1: PER_AVATAR_ANNUAL_COMMISSION.qualifiedFundHeavy,
    };
  }
  if (row.hasDependentsUnder18 === true) {
    return { avatar: "family_legacy", scoreY1: PER_AVATAR_ANNUAL_COMMISSION.familyLegacy };
  }
  return { avatar: null, scoreY1: 0 };
}

export async function importBookCsv(user: User, csvText: string) {
  const { rows, skipped } = parseBookCsv(csvText);

  const created = await prisma.$transaction(
    rows.map((row) => {
      const { avatar, scoreY1 } = scoreBookClient(row);
      return prisma.bookClient.create({
        data: { userId: user.id, ...row, avatar, scoreY1 },
      });
    }),
  );

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "book.imported",
      target: user.id,
      metadata: {
        imported: created.length,
        skipped: skipped.length,
        skippedRows: skipped.slice(0, 20),
        totalScoreY1: created.reduce((sum, c) => sum + c.scoreY1, 0),
      },
    },
  });

  return { imported: created.length, skipped };
}

export async function listBookClients(userId: string) {
  return prisma.bookClient.findMany({
    where: { userId },
    include: { scenario: { select: { id: true, label: true, status: true } } },
    orderBy: [{ scoreY1: "desc" }, { name: "asc" }],
  });
}

// The highest-opportunity clients still sitting in the imported book with no
// case started yet — so the weekly call queue surfaces "who to work next"
// from the whole book, not just the scenarios the agent has already opened.
// Un-started (scenarioId null) and actually scored (scoreY1 > 0, i.e. the
// import could classify an avatar); ranked by the locked per-avatar Y1
// commission model.
export async function getTopBookOpportunities(userId: string, limit = 3) {
  return prisma.bookClient.findMany({
    where: { userId, scenarioId: null, scoreY1: { gt: 0 } },
    orderBy: [{ scoreY1: "desc" }, { name: "asc" }],
    take: limit,
  });
}

// "Start a case": promotes a book client into a Scenario with the intake
// pre-seeded from everything the book already knows — the agent lands on
// the intake with the avatar questions answered and Atlas ready to run.
export async function startCaseFromBookClient(user: User, bookClientId: string) {
  const client = await prisma.bookClient.findUnique({ where: { id: bookClientId } });
  if (!client || client.userId !== user.id) {
    throw new BookImportError("Book client not found.");
  }
  if (client.scenarioId) {
    return client.scenarioId;
  }

  const scenario = await prisma.scenario.create({
    data: {
      userId: user.id,
      label: client.name,
      notes: client.notes,
      primaryAge: client.age,
      businessOwnerStatus: client.businessOwner === true ? "business_owner" : null,
      coOwnersNotes: client.hasCoOwners === true ? "Has co-owners (from book import) — get ages and ownership %" : null,
      netWorthEstimate: client.netWorthEstimate,
      qualifiedFundsEstimate: client.qualifiedFundsEstimate,
      hasDependentsUnder18: client.hasDependentsUnder18,
    },
  });
  await prisma.bookClient.update({
    where: { id: client.id },
    data: { scenarioId: scenario.id },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "book.case_started",
      target: scenario.id,
      metadata: { bookClientId: client.id, avatar: client.avatar, scoreY1: client.scoreY1 },
    },
  });
  return scenario.id;
}
