import { prisma } from "@/lib/prisma";
import { AGENT_MONTHLY_PLAN, AGENT_ANNUAL_PLAN } from "@/lib/stripe";
import { hasActiveAccess } from "@/lib/billing";
import { imoSeatSummary } from "@/lib/imo";
import type { User, Subscription, AgentProfile } from "@/generated/prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHLY_PRICE = 97;
// docs/08-master-dashboard.md section 2, Widget 1: "annual prepay ($X ÷ 12)."
const ANNUAL_PRICE = 970;
const ANNUAL_MONTHLY_EQUIVALENT = ANNUAL_PRICE / 12;

function daysSince(date: Date | null | undefined, now: number): number {
  return date ? (now - date.getTime()) / DAY_MS : Infinity;
}

export type EngagementScore = "high" | "medium" | "low";

// docs/08-master-dashboard.md section 2, Sub-module 3A. This app has no
// separate "prospect" entity distinct from a Scenario — a Scenario *is* the
// logged prospect — so "added a prospect" and "generated a scenario" are
// read from the same table: "added a prospect" = a Scenario was created,
// "generated a scenario" = its intake was completed (the point at which the
// recommendation engine actually runs).
export function engagementScoreFor(
  lastLoginAt: Date | null,
  mostRecentScenarioCreatedAt: Date | null,
  mostRecentIntakeCompletedAt: Date | null,
  now: number = Date.now(),
): EngagementScore {
  const loginDays = daysSince(lastLoginAt, now);
  const prospectDays = daysSince(mostRecentScenarioCreatedAt, now);
  const scenarioDays = daysSince(mostRecentIntakeCompletedAt, now);

  if (loginDays <= 7 && prospectDays <= 30 && scenarioDays <= 60) return "high";
  if (loginDays <= 14 && prospectDays <= 90) return "medium";
  return "low";
}

interface AgentWithRelations extends User {
  subscription: Subscription | null;
  agentProfile: AgentProfile | null;
}

async function getAgentUsers(): Promise<AgentWithRelations[]> {
  return prisma.user.findMany({
    where: { role: "user" },
    include: { subscription: true, agentProfile: true },
    orderBy: { createdAt: "desc" },
  });
}

function mrrContribution(subscription: Subscription | null): number {
  // Only the real Stripe-billed plans count as revenue — "comped"
  // subscriptions (docs/20-business-plan.md's design-partner/beta comps,
  // src/lib/admin.ts's grantAccess) are access without revenue.
  if (!subscription || !hasActiveAccess(subscription.status)) return 0;
  if (subscription.plan === AGENT_ANNUAL_PLAN) return Math.round(ANNUAL_MONTHLY_EQUIVALENT);
  if (subscription.plan === AGENT_MONTHLY_PLAN) return MONTHLY_PRICE;
  return 0;
}

export interface ClientRow {
  user: AgentWithRelations;
  mrr: number;
  engagementScore: EngagementScore;
  scenarioCount: number;
}

// docs/08-master-dashboard.md section 2, Module 1 — the Agents tab. The IMOs
// tab isn't built yet: no IMO/white-label data model exists in this repo
// (that's Session 3's job), so there's nothing to list there yet.
export async function getClientsList(): Promise<ClientRow[]> {
  const now = Date.now();
  const users = await getAgentUsers();

  return Promise.all(
    users.map(async (user) => {
      const [scenarioCount, mostRecentScenario, mostRecentIntake] = await Promise.all([
        prisma.scenario.count({ where: { userId: user.id } }),
        prisma.scenario.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
        prisma.scenario.findFirst({
          where: { userId: user.id, intakeCompletedAt: { not: null } },
          orderBy: { intakeCompletedAt: "desc" },
        }),
      ]);

      return {
        user,
        mrr: mrrContribution(user.subscription),
        engagementScore: engagementScoreFor(
          user.lastLoginAt,
          mostRecentScenario?.createdAt ?? null,
          mostRecentIntake?.intakeCompletedAt ?? null,
          now,
        ),
        scenarioCount,
      };
    }),
  );
}

export interface RevenueSegment {
  label: string;
  count: number;
  mrr: number;
}

export interface RevenueMetrics {
  totalMRR: number;
  activePayingCount: number;
  newMRRThisMonth: number;
  newSubscriptionsThisMonth: number;
  churnedMRRThisMonth: number;
  churnedSubscriptionsThisMonth: number;
  // Doc's formula is "churned MRR / starting MRR." This repo doesn't persist
  // historical MRR snapshots, so "starting MRR" is approximated as this
  // month's current total plus what churned out of it this month — a
  // reasonable stand-in, not a stored time series.
  churnRatePercent: number | null;
  // docs/08-master-dashboard.md section 2, Widget 4 "MRR by segment."
  segments: RevenueSegment[];
}

// docs/08-master-dashboard.md section 2, Module 2. IMO seats contribute to
// total MRR and their own segment, but not to "new/churned MRR this month" —
// IMO contracts are managed as a single seatsPurchased count (src/lib/imo.ts),
// with no per-seat history log, so there's no reliable "seat added/removed
// this month" signal the way there is for a Stripe subscription's
// createdAt/canceled event.
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [activeMonthly, activeAnnual, newMonthly, newAnnual, churnedMonthly, churnedAnnual, imos] =
    await Promise.all([
      prisma.subscription.findMany({
        where: { plan: AGENT_MONTHLY_PLAN, status: { in: ["active", "trialing"] } },
      }),
      prisma.subscription.findMany({
        where: { plan: AGENT_ANNUAL_PLAN, status: { in: ["active", "trialing"] } },
      }),
      prisma.subscription.findMany({
        where: {
          plan: AGENT_MONTHLY_PLAN,
          status: { in: ["active", "trialing"] },
          createdAt: { gte: monthStart },
        },
      }),
      prisma.subscription.findMany({
        where: {
          plan: AGENT_ANNUAL_PLAN,
          status: { in: ["active", "trialing"] },
          createdAt: { gte: monthStart },
        },
      }),
      prisma.subscription.findMany({
        where: { plan: AGENT_MONTHLY_PLAN, status: "canceled", updatedAt: { gte: monthStart } },
      }),
      prisma.subscription.findMany({
        where: { plan: AGENT_ANNUAL_PLAN, status: "canceled", updatedAt: { gte: monthStart } },
      }),
      prisma.imo.findMany({ include: { agents: true } }),
    ]);

  const monthlyMRR = activeMonthly.length * MONTHLY_PRICE;
  const annualMRR = Math.round(activeAnnual.length * ANNUAL_MONTHLY_EQUIVALENT);
  const imoSeatTotals = imos.map((imo) => imoSeatSummary(imo));
  const imoMRR = imoSeatTotals.reduce((sum, s) => sum + s.mrr, 0);
  const imoActiveSeats = imoSeatTotals.reduce((sum, s) => sum + s.seatsActive, 0);
  const totalMRR = monthlyMRR + annualMRR + imoMRR;

  const newMRRThisMonth =
    newMonthly.length * MONTHLY_PRICE + Math.round(newAnnual.length * ANNUAL_MONTHLY_EQUIVALENT);
  const churnedMRRThisMonth =
    churnedMonthly.length * MONTHLY_PRICE + Math.round(churnedAnnual.length * ANNUAL_MONTHLY_EQUIVALENT);
  const startingMRR = totalMRR + churnedMRRThisMonth;

  return {
    totalMRR,
    activePayingCount: activeMonthly.length + activeAnnual.length + imoActiveSeats,
    newMRRThisMonth,
    newSubscriptionsThisMonth: newMonthly.length + newAnnual.length,
    churnedMRRThisMonth,
    churnedSubscriptionsThisMonth: churnedMonthly.length + churnedAnnual.length,
    churnRatePercent: startingMRR > 0 ? Math.round((churnedMRRThisMonth / startingMRR) * 1000) / 10 : null,
    segments: [
      { label: "Individual agents (monthly)", count: activeMonthly.length, mrr: monthlyMRR },
      { label: "Individual agents (annual)", count: activeAnnual.length, mrr: annualMRR },
      { label: "IMOs (active seats)", count: imoActiveSeats, mrr: imoMRR },
    ],
  };
}

export interface TopActiveAgent {
  user: User;
  scenariosCreated: number;
  handoffsSent: number;
}

export interface ActivityMetrics {
  topActiveAgents: TopActiveAgent[];
  scenariosThisWeek: number;
  scenariosThisMonth: number;
  scenariosThisQuarter: number;
  handoffsSentThisWeek: number;
  pivotsTriggeredThisWeek: number;
  avgEngagementScore: EngagementScore | null;
  activationRatePercent: number | null;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

// docs/08-master-dashboard.md section 2, Module 3. Pitch decks and COI
// action tracking aren't real features in this repo yet (Phase 4 Sessions
// 1-3 and CLAUDE.md's COI actions are both content/feature gaps documented
// in docs/01-phased-build-plan.md), so those two counters from the doc's
// list aren't included here.
export async function getActivityMetrics(): Promise<ActivityMetrics> {
  const now = Date.now();
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);
  const quarterAgo = daysAgo(90);

  const [
    users,
    scenariosThisWeek,
    scenariosThisMonth,
    scenariosThisQuarter,
    handoffEvents,
    pivotEvents,
  ] = await Promise.all([
    getAgentUsers(),
    prisma.scenario.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.scenario.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.scenario.count({ where: { createdAt: { gte: quarterAgo } } }),
    prisma.auditLog.findMany({ where: { action: "wholesaler.notified", createdAt: { gte: weekAgo } } }),
    prisma.auditLog.findMany({ where: { action: "scenario.pivot_triggered", createdAt: { gte: weekAgo } } }),
  ]);

  const scenarioCountsThisWeek = new Map<string, number>();
  const handoffCountsThisWeek = new Map<string, number>();
  for (const event of handoffEvents) {
    if (!event.actorId) continue;
    handoffCountsThisWeek.set(event.actorId, (handoffCountsThisWeek.get(event.actorId) ?? 0) + 1);
  }

  const recentScenarios = await prisma.scenario.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { userId: true },
  });
  for (const scenario of recentScenarios) {
    scenarioCountsThisWeek.set(scenario.userId, (scenarioCountsThisWeek.get(scenario.userId) ?? 0) + 1);
  }

  const engagementScores: EngagementScore[] = [];
  let activatedWithin7Days = 0;

  const topActiveAgents: TopActiveAgent[] = [];
  for (const user of users) {
    const [mostRecentScenario, mostRecentIntake, firstScenario] = await Promise.all([
      prisma.scenario.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.scenario.findFirst({
        where: { userId: user.id, intakeCompletedAt: { not: null } },
        orderBy: { intakeCompletedAt: "desc" },
      }),
      prisma.scenario.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    ]);

    engagementScores.push(
      engagementScoreFor(user.lastLoginAt, mostRecentScenario?.createdAt ?? null, mostRecentIntake?.intakeCompletedAt ?? null, now),
    );

    if (firstScenario && (firstScenario.createdAt.getTime() - user.createdAt.getTime()) / DAY_MS <= 7) {
      activatedWithin7Days += 1;
    }

    const scenariosCreated = scenarioCountsThisWeek.get(user.id) ?? 0;
    const handoffsSent = handoffCountsThisWeek.get(user.id) ?? 0;
    if (scenariosCreated > 0 || handoffsSent > 0) {
      topActiveAgents.push({ user, scenariosCreated, handoffsSent });
    }
  }

  topActiveAgents.sort((a, b) => b.scenariosCreated + b.handoffsSent - (a.scenariosCreated + a.handoffsSent));

  const scoreRank: Record<EngagementScore, number> = { low: 0, medium: 1, high: 2 };
  const avgScoreValue =
    engagementScores.length > 0
      ? engagementScores.reduce((sum, s) => sum + scoreRank[s], 0) / engagementScores.length
      : null;
  const avgEngagementScore: EngagementScore | null =
    avgScoreValue === null ? null : avgScoreValue >= 1.5 ? "high" : avgScoreValue >= 0.5 ? "medium" : "low";

  return {
    topActiveAgents: topActiveAgents.slice(0, 20),
    scenariosThisWeek,
    scenariosThisMonth,
    scenariosThisQuarter,
    handoffsSentThisWeek: handoffEvents.length,
    pivotsTriggeredThisWeek: pivotEvents.length,
    avgEngagementScore,
    activationRatePercent:
      users.length > 0 ? Math.round((activatedWithin7Days / users.length) * 1000) / 10 : null,
  };
}

export interface AtRiskAgent {
  user: User;
  lastLoginAt: Date | null;
  reason: string;
}

export interface ChurnedAgent {
  user: User;
  subscription: Subscription;
}

export interface ChurnMetrics {
  atRiskAgents: AtRiskAgent[];
  churnedThisMonth: ChurnedAgent[];
}

// docs/08-master-dashboard.md section 2, Module 4. Sub-module 4A's first
// trigger ("declining activity vs. 90-day average") needs a historical
// activity baseline this repo doesn't track — only the other two triggers
// (no login in 14+ days; 0 active scenarios and no new one in 60+ days) are
// built. Sub-module 4B's "top reasons" needs a cancellation survey that
// doesn't exist. Sub-module 4C's win-back queue needs a persisted
// contacted/re-engaged status this repo has no model for yet — not built.
export async function getChurnMetrics(): Promise<ChurnMetrics> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const users = await getAgentUsers();

  const atRiskAgents: AtRiskAgent[] = [];
  for (const user of users) {
    if (!hasActiveAccess(user.subscription?.status)) continue;

    const [openScenarioCount, mostRecentScenario] = await Promise.all([
      prisma.scenario.count({ where: { userId: user.id, status: { notIn: ["closed_won", "closed_lost"] } } }),
      prisma.scenario.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    ]);

    const loginDays = daysSince(user.lastLoginAt, Date.now());
    const noRecentScenario = daysSince(mostRecentScenario?.createdAt ?? null, Date.now()) > 60;

    if (loginDays > 14) {
      atRiskAgents.push({ user, lastLoginAt: user.lastLoginAt, reason: "No login in 14+ days" });
    } else if (openScenarioCount === 0 && noRecentScenario) {
      atRiskAgents.push({
        user,
        lastLoginAt: user.lastLoginAt,
        reason: "0 active scenarios and no new prospect in 60+ days",
      });
    }
  }

  const churnedSubs = await prisma.subscription.findMany({
    where: { plan: AGENT_MONTHLY_PLAN, status: "canceled", updatedAt: { gte: monthStart } },
    include: { user: true },
  });

  return {
    atRiskAgents,
    churnedThisMonth: churnedSubs.map((sub) => ({ user: sub.user, subscription: sub })),
  };
}
