import { prisma } from "@/lib/prisma";
import { engagementScoreFor, type EngagementScore } from "@/lib/engagement";
import type { User, ImoOrgType } from "@/generated/prisma/client";

export class ImoActionError extends Error {}

// CLAUDE.md / docs/20-business-plan.md: "$75/seat/month." Flat regardless of
// seat count — 50/100/500+ are typical contract sizes, not a rate schedule.
export const IMO_PRICE_PER_SEAT = 75;

function assertAdmin(actor: User) {
  if (actor.role !== "admin") {
    throw new ImoActionError("Only admins can manage IMOs.");
  }
}

export interface CreateImoInput {
  name: string;
  organizationType: ImoOrgType;
  primaryContactName?: string;
  primaryContactEmail?: string;
  seatsPurchased: number;
  contractTerms?: string;
}

export async function createImo(admin: User, input: CreateImoInput) {
  assertAdmin(admin);

  const name = input.name.trim();
  if (!name) {
    throw new ImoActionError("An IMO name is required.");
  }
  if (!Number.isInteger(input.seatsPurchased) || input.seatsPurchased <= 0) {
    throw new ImoActionError("Seats purchased must be a positive whole number.");
  }

  const imo = await prisma.imo.create({
    data: {
      name,
      organizationType: input.organizationType,
      primaryContactName: input.primaryContactName?.trim() || null,
      primaryContactEmail: input.primaryContactEmail?.trim() || null,
      seatsPurchased: input.seatsPurchased,
      contractTerms: input.contractTerms?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "imo.created",
      target: imo.id,
      metadata: { name, seatsPurchased: input.seatsPurchased },
    },
  });

  return imo;
}

// docs/08-master-dashboard.md section 5: "Add seats (which triggers a
// billing event) / Remove seats (which triggers a credit)." IMO contracts
// are sold and invoiced manually (section 5's "your contract" language), not
// through a self-serve Stripe flow — this logs the billing event to
// audit_log for the sales/ops team, rather than integrating real billing.
export async function updateImoSeats(admin: User, imoId: string, seatsPurchased: number) {
  assertAdmin(admin);
  if (!Number.isInteger(seatsPurchased) || seatsPurchased <= 0) {
    throw new ImoActionError("Seats purchased must be a positive whole number.");
  }

  const before = await prisma.imo.findUnique({ where: { id: imoId } });
  if (!before) {
    throw new ImoActionError("IMO not found.");
  }

  const imo = await prisma.imo.update({ where: { id: imoId }, data: { seatsPurchased } });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "imo.seats_updated",
      target: imoId,
      metadata: { from: before.seatsPurchased, to: seatsPurchased },
    },
  });

  return imo;
}

export interface ImoBrandingInput {
  logoUrl?: string;
  accentColor?: string;
  byline?: string;
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

// docs/00-developer-brief.md's white-label branding engine: "logo, color,
// byline per IMO." Applied to the in-app nav (src/app/app/layout.tsx) for
// seated agents — branding pre-authentication pages (login/signup) or a
// custom domain per IMO would need real multi-tenant routing infrastructure
// that's out of scope here.
export async function updateImoBranding(admin: User, imoId: string, input: ImoBrandingInput) {
  assertAdmin(admin);

  const accentColor = input.accentColor?.trim() || null;
  if (accentColor && !HEX_COLOR_PATTERN.test(accentColor)) {
    throw new ImoActionError("Accent color must be a hex code like #1a5fb4.");
  }

  const existing = await prisma.imo.findUnique({ where: { id: imoId } });
  if (!existing) {
    throw new ImoActionError("IMO not found.");
  }

  const imo = await prisma.imo.update({
    where: { id: imoId },
    data: {
      logoUrl: input.logoUrl?.trim() || null,
      accentColor,
      byline: input.byline?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "imo.branding_updated", target: imoId, metadata: { ...input } },
  });

  return imo;
}

export async function assignAgentToImo(admin: User, agentUserId: string, imoId: string) {
  assertAdmin(admin);

  const [agent, imo] = await Promise.all([
    prisma.user.findUnique({ where: { id: agentUserId } }),
    prisma.imo.findUnique({ where: { id: imoId } }),
  ]);
  if (!agent || agent.role !== "user") {
    throw new ImoActionError("Agent not found.");
  }
  if (!imo) {
    throw new ImoActionError("IMO not found.");
  }

  await prisma.user.update({ where: { id: agentUserId }, data: { imoId } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "imo.agent_assigned", target: agentUserId, metadata: { imoId } },
  });
}

export async function unassignAgentFromImo(admin: User, agentUserId: string) {
  assertAdmin(admin);

  await prisma.user.update({ where: { id: agentUserId }, data: { imoId: null } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "imo.agent_unassigned", target: agentUserId, metadata: {} },
  });
}

export async function listImosForAdmin() {
  return prisma.imo.findMany({
    include: { agents: true },
    orderBy: { createdAt: "desc" },
  });
}

// docs/08-master-dashboard.md section 7's imos table: "seats_active" —
// assigned agents in good standing (not suspended). "Seats churning" is the
// gap between what's purchased and what's actively filled (unused/lost
// capacity), per section 5's "seat utilization (purchased / active /
// churning)" framing.
export function imoSeatSummary(imo: { seatsPurchased: number; agents: Array<Pick<User, "status">> }) {
  const seatsActive = imo.agents.filter((a) => a.status === "active").length;
  const seatsChurning = Math.max(imo.seatsPurchased - seatsActive, 0);
  const mrr = seatsActive * IMO_PRICE_PER_SEAT;
  return { seatsActive, seatsChurning, mrr };
}

// docs/08-master-dashboard.md section 7 — a seated agent gets dashboard
// access via the IMO's contract, not their own Stripe Subscription.
export function hasImoSeatAccess(user: Pick<User, "imoId" | "status">): boolean {
  return Boolean(user.imoId) && user.status === "active";
}

export interface SeatUsageRow {
  agent: User;
  engagementScore: EngagementScore;
  scenarioCount: number;
}

// docs/20-business-plan.md section "Per IMO": "seats active, seats churning."
// docs/08-master-dashboard.md doesn't give a per-seat detail view beyond the
// aggregate counts (imoSeatSummary above) — this reuses the same engagement
// scoring the master dashboard's Clients module uses, so an IMO admin can see
// which specific seats are being used, not just how many.
export async function getImoSeatUsage(imoId: string): Promise<SeatUsageRow[]> {
  const agents = await prisma.user.findMany({ where: { imoId }, orderBy: { name: "asc" } });
  const now = Date.now();

  return Promise.all(
    agents.map(async (agent) => {
      const [scenarioCount, mostRecentScenario, mostRecentIntake] = await Promise.all([
        prisma.scenario.count({ where: { userId: agent.id } }),
        prisma.scenario.findFirst({ where: { userId: agent.id }, orderBy: { createdAt: "desc" } }),
        prisma.scenario.findFirst({
          where: { userId: agent.id, intakeCompletedAt: { not: null } },
          orderBy: { intakeCompletedAt: "desc" },
        }),
      ]);

      return {
        agent,
        scenarioCount,
        engagementScore: engagementScoreFor(
          agent.lastLoginAt,
          mostRecentScenario?.createdAt ?? null,
          mostRecentIntake?.intakeCompletedAt ?? null,
          now,
        ),
      };
    }),
  );
}
