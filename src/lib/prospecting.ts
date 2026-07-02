import { prisma } from "@/lib/prisma";
import { computeExpectedCommissionValue } from "@/lib/commission";
import { recommendStrategies } from "@/lib/recommendations";
import { getLifeUnderwritingIntake } from "@/lib/underwriting";
import type { Scenario, ScenarioStatus } from "@/generated/prisma/client";

const CLOSED_STATUSES: ScenarioStatus[] = ["closed_won", "closed_lost"];

// docs/00-developer-brief.md: "This week, call these 3 prospects with these
// pitches."
export const WEEKLY_CALL_QUEUE_SIZE = 3;

export interface RankedProspect {
  scenario: Scenario;
  expectedCommission: number;
  closeRate: number | null;
  expectedCommissionValue: number | null;
}

function valueOf(prospect: RankedProspect) {
  return prospect.expectedCommissionValue ?? prospect.expectedCommission;
}

// docs/01-phased-build-plan.md Session 7 def-of-done: "Prospecting list shows
// the agent's prospects ranked by opportunity value." A "prospect" here is an
// open (non-closed) scenario — same entity docs/03-intake-flow.md's own
// worked example uses when it says a scenario gets "logged in the agent's
// prospecting list."
export async function rankProspects(userId: string): Promise<RankedProspect[]> {
  const scenarios = await prisma.scenario.findMany({
    where: { userId, status: { notIn: CLOSED_STATUSES } },
    orderBy: { createdAt: "desc" },
  });

  const ranked = await Promise.all(
    scenarios.map(async (scenario) => {
      const { expectedCommission, closeRate, expectedCommissionValue } = await computeExpectedCommissionValue(
        userId,
        scenario,
      );
      return { scenario, expectedCommission, closeRate, expectedCommissionValue };
    }),
  );

  ranked.sort((a, b) => valueOf(b) - valueOf(a));
  return ranked;
}

// Monday 00:00 UTC of the week containing `date`, matching "auto-generates
// each Monday" without needing a real cron/job runner.
export function getWeekStart(date: Date = new Date()): Date {
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = weekStart.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
  return weekStart;
}

async function pitchFor(scenario: Scenario): Promise<string> {
  const lifeUnderwritingIntake = await getLifeUnderwritingIntake(scenario.userId, scenario.id);
  const { pivot, recommendations } = await recommendStrategies(scenario, lifeUnderwritingIntake);

  const topEligible = recommendations.find((r) => r.eligibility === "eligible");
  if (topEligible) {
    // Under a pivot this is already the annuity-side strategy — still the
    // right pitch line for the call queue.
    return topEligible.strategy.name;
  }

  if (pivot.triggered) {
    return "No fitting strategy yet — this case needs the annuity-side pivot (see the intake page).";
  }

  const needsMoreInfo = recommendations.find((r) => r.eligibility === "needs_more_info");
  return needsMoreInfo
    ? `Complete the intake to confirm eligibility for ${needsMoreInfo.strategy.name}`
    : "Complete the intake to get a strategy recommendation.";
}

export interface CallQueueEntry {
  scenario: Scenario;
  rank: number;
  pitchStrategyName: string;
}

// Lazily generates (and persists) this week's top-N prospects the first time
// the agent opens the queue in a given week; later visits the same week
// return the pinned snapshot rather than re-ranking, so the queue doesn't
// reshuffle mid-week as new scenarios or estimates come in.
export async function getOrCreateWeeklyCallQueue(userId: string): Promise<CallQueueEntry[]> {
  const weekStart = getWeekStart();

  const existing = await prisma.weeklyCallQueueEntry.findMany({
    where: { userId, weekStart },
    include: { scenario: true },
    orderBy: { rank: "asc" },
  });

  if (existing.length > 0) {
    return existing.map((entry) => ({
      scenario: entry.scenario,
      rank: entry.rank,
      pitchStrategyName: entry.pitchStrategyName ?? "Complete the intake to get a strategy recommendation.",
    }));
  }

  const ranked = await rankProspects(userId);
  const top = ranked.slice(0, WEEKLY_CALL_QUEUE_SIZE);
  if (top.length === 0) return [];

  const entries = await Promise.all(
    top.map(async (prospect, index) => {
      const pitchStrategyName = await pitchFor(prospect.scenario);
      return { scenario: prospect.scenario, rank: index + 1, pitchStrategyName };
    }),
  );

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.weeklyCallQueueEntry.upsert({
        where: {
          userId_weekStart_scenarioId: { userId, weekStart, scenarioId: entry.scenario.id },
        },
        create: {
          userId,
          weekStart,
          scenarioId: entry.scenario.id,
          rank: entry.rank,
          pitchStrategyName: entry.pitchStrategyName,
        },
        update: {},
      }),
    ),
  );

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "prospecting.weekly_call_queue_generated",
      target: userId,
      metadata: { weekStart: weekStart.toISOString(), scenarioIds: entries.map((e) => e.scenario.id) },
    },
  });

  return entries;
}
