import { describe, it, expect } from "vitest";
import { BookImportError, parseBookCsv, scoreBookClient } from "@/lib/book-import";
import { PER_AVATAR_ANNUAL_COMMISSION } from "@/lib/book-of-business";

describe("book CSV parser", () => {
  it("parses tolerant headers and value formats", () => {
    const csv = [
      "Client Name,Age,Business Owner,Co-Owners,Net Worth,Qualified Funds,Kids,Notes",
      'Sam Henderson,67,no,,"$1,200,000",750k,no,Referred by Bill',
      "Rita Alvarez,52,YES,y,2.5m,,yes,",
      "Lee Chang,,,,300000,no,,",
    ].join("\n");

    const { rows, skipped } = parseBookCsv(csv);
    expect(skipped).toEqual([]);
    expect(rows).toHaveLength(3);

    expect(rows[0]).toMatchObject({
      name: "Sam Henderson",
      age: 67,
      businessOwner: false,
      netWorthEstimate: "range_500k_2m",
      qualifiedFundsEstimate: "over_500k",
      hasDependentsUnder18: false,
      notes: "Referred by Bill",
    });
    expect(rows[1]).toMatchObject({
      name: "Rita Alvarez",
      businessOwner: true,
      hasCoOwners: true,
      netWorthEstimate: "range_2m_5m",
      hasDependentsUnder18: true,
    });
    expect(rows[2]).toMatchObject({
      name: "Lee Chang",
      age: null,
      netWorthEstimate: "under_500k",
      qualifiedFundsEstimate: "under_500k",
    });
  });

  it("skips nameless rows (with the row number) instead of failing the file", () => {
    const csv = ["name,age", "Alice,50", ",44", "Bob,61"].join("\n");
    const { rows, skipped } = parseBookCsv(csv);
    expect(rows.map((r) => r.name)).toEqual(["Alice", "Bob"]);
    expect(skipped).toEqual([{ row: 2, reason: "no name" }]);
  });

  it("leaves unreadable values blank — never guesses", () => {
    const csv = ["name,net worth,business owner", "Pat,maybe a lot,perhaps"].join("\n");
    const { rows } = parseBookCsv(csv);
    expect(rows[0].netWorthEstimate).toBeNull();
    expect(rows[0].businessOwner).toBeNull();
  });

  it("rejects files without a name column or without data rows", () => {
    expect(() => parseBookCsv("age,notes\n50,hi")).toThrow(BookImportError);
    expect(() => parseBookCsv("name,age")).toThrow(BookImportError);
  });
});

describe("book client scoring (docs/07 per-avatar Y1 model, CLAUDE.md priority order)", () => {
  it("scores by avatar priority BO → HNW → QFH → Family", () => {
    expect(
      scoreBookClient({
        name: "x",
        age: null,
        businessOwner: true,
        hasCoOwners: true,
        netWorthEstimate: "over_5m",
        qualifiedFundsEstimate: "over_500k",
        hasDependentsUnder18: true,
        notes: null,
      }),
    ).toEqual({
      avatar: "business_owner",
      scoreY1: PER_AVATAR_ANNUAL_COMMISSION.businessOwnersWithCoOwners,
    });

    expect(
      scoreBookClient({
        name: "x",
        age: null,
        businessOwner: true,
        hasCoOwners: null,
        netWorthEstimate: null,
        qualifiedFundsEstimate: null,
        hasDependentsUnder18: null,
        notes: null,
      }).scoreY1,
    ).toBe(PER_AVATAR_ANNUAL_COMMISSION.businessOwnersSolo);

    expect(
      scoreBookClient({
        name: "x",
        age: null,
        businessOwner: false,
        hasCoOwners: null,
        netWorthEstimate: "range_2m_5m",
        qualifiedFundsEstimate: "over_500k",
        hasDependentsUnder18: null,
        notes: null,
      }),
    ).toEqual({ avatar: "high_net_worth", scoreY1: PER_AVATAR_ANNUAL_COMMISSION.hnwIndividuals });

    expect(
      scoreBookClient({
        name: "x",
        age: null,
        businessOwner: null,
        hasCoOwners: null,
        netWorthEstimate: "under_500k",
        qualifiedFundsEstimate: "over_500k",
        hasDependentsUnder18: null,
        notes: null,
      }),
    ).toEqual({
      avatar: "qualified_fund_heavy",
      scoreY1: PER_AVATAR_ANNUAL_COMMISSION.qualifiedFundHeavy,
    });

    expect(
      scoreBookClient({
        name: "x",
        age: null,
        businessOwner: null,
        hasCoOwners: null,
        netWorthEstimate: null,
        qualifiedFundsEstimate: null,
        hasDependentsUnder18: true,
        notes: null,
      }),
    ).toEqual({ avatar: "family_legacy", scoreY1: PER_AVATAR_ANNUAL_COMMISSION.familyLegacy });
  });

  it("returns avatar null / score 0 when the fields can't classify — never guesses", () => {
    expect(
      scoreBookClient({
        name: "x",
        age: 44,
        businessOwner: null,
        hasCoOwners: null,
        netWorthEstimate: null,
        qualifiedFundsEstimate: null,
        hasDependentsUnder18: null,
        notes: null,
      }),
    ).toEqual({ avatar: null, scoreY1: 0 });
  });
});
