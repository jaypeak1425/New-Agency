import { prisma } from "@/lib/prisma";
import { rankProspects } from "@/lib/prospecting";
import { computeThisYearsPipeline, computeClosedThisYear } from "@/lib/dashboard";
import { computeBookOfBusinessOpportunity } from "@/lib/book-of-business";
import { getAgentProfile } from "@/lib/onboarding";
import { agingMessage } from "@/lib/aging";
import type { ProductType } from "@/generated/prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Nudge {
  type: "inactivity" | "concentration" | "book_activation" | "goal_tracking" | "strategy_diversity";
  message: string;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  permanent_life: "permanent life",
  term_life: "term life",
  survivorship_life: "survivorship life",
  annuity: "annuity",
  coli_face_amount: "COLI",
  executive_bonus_162: "executive bonus",
  disability_income: "disability income",
  ltc_hybrid: "LTC hybrid",
};

// docs/07-progress-dashboard-math.md section 7's frequency rules ("once per
// scenario per 7 days", "once per week", "once per month", "quarterly") are
// enforced by checking audit_log for the same nudge action + target inside
// the window — every surfaced nudge is logged (the doc's section 9 requires
// nudges in the audit log anyway), and a logged nudge suppresses itself until
// its window lapses. No cron exists, so nudges are computed when the agent
// opens the dashboard, not pushed.
async function surfaceWithCap(
  userId: string,
  action: string,
  target: string,
  windowDays: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowDays * DAY_MS);
  const recent = await prisma.auditLog.findFirst({
    where: { action, target, createdAt: { gte: since } },
  });
  if (recent) return false;

  await prisma.auditLog.create({
    data: { actorId: userId, action, target, metadata: {} },
  });
  return true;
}

function daysSince(date: Date, now: number): number {
  return Math.floor((now - date.getTime()) / DAY_MS);
}

export interface AtlasFeed {
  nudges: Nudge[];
  agingMessages: string[];
}

export async function computeAtlasFeed(userId: string): Promise<AtlasFeed> {
  const now = Date.now();
  const [prospects, thisYear, closed, agentProfile] = await Promise.all([
    rankProspects(userId),
    computeThisYearsPipeline(userId),
    computeClosedThisYear(userId),
    getAgentProfile(userId),
  ]);

  const nudges: Nudge[] = [];

  // Section 6's aging flags are state, not events — always visible, no cap.
  const agingMessages = prospects
    .map((p) => agingMessage(p.scenario, now))
    .filter((m): m is string => m !== null);

  // Trigger 1: inactivity — 4+ days without activity on an open scenario,
  // once per scenario per 7 days.
  for (const prospect of prospects) {
    const idleDays = daysSince(prospect.scenario.updatedAt, now);
    if (idleDays >= 4 && idleDays <= 7) {
      if (await surfaceWithCap(userId, "nudge.inactivity", prospect.scenario.id, 7)) {
        nudges.push({
          type: "inactivity",
          message: `You haven't logged activity in ${idleDays} days. What happened with the ${prospect.scenario.label} scenario?`,
        });
      }
    }
  }

  // Trigger 2: pipeline concentration — top scenario >50% of pipeline value,
  // once per week.
  const valueOf = (p: (typeof prospects)[number]) => p.expectedCommissionValue ?? p.expectedCommission;
  const pipelineTotal = prospects.reduce((sum, p) => sum + valueOf(p), 0);
  if (prospects.length >= 2 && pipelineTotal > 0) {
    const top = prospects[0];
    const share = valueOf(top) / pipelineTotal;
    if (share > 0.5 && (await surfaceWithCap(userId, "nudge.concentration", userId, 7))) {
      nudges.push({
        type: "concentration",
        message: `${Math.round(share * 100)}% of your pipeline value is in the ${top.scenario.label} scenario. Consider activating 2-3 more prospects this week to diversify.`,
      });
    }
  }

  // Trigger 3: book activation — once per month. "Activated" = the expected
  // commission of everything put in motion YTD (This Year's Pipeline total).
  const book = computeBookOfBusinessOpportunity(agentProfile);
  if (book && book.addressableOpportunity > 0) {
    const activated = thisYear.total;
    const percent = Math.round((activated / book.addressableOpportunity) * 100);
    if (percent < 100 && (await surfaceWithCap(userId, "nudge.book_activation", userId, 30))) {
      nudges.push({
        type: "book_activation",
        message: `You've activated $${activated.toLocaleString()} — ${percent}% of your $${book.addressableOpportunity.toLocaleString()} addressable book. Want to see which prospects to prioritize next?`,
      });
    }
  }

  // Trigger 4: goal tracking — monthly, only when behind pace against the
  // agent's own goal (AgentProfile.goalIncome from onboarding).
  if (agentProfile?.goalIncome && agentProfile.goalIncome > 0) {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const yearFraction = (now - yearStart) / (365 * DAY_MS);
    const behindPace = closed.total < agentProfile.goalIncome * yearFraction;
    if (behindPace && (await surfaceWithCap(userId, "nudge.goal_tracking", userId, 30))) {
      const remaining = agentProfile.goalIncome - closed.total;
      nudges.push({
        type: "goal_tracking",
        message: `You're at $${closed.total.toLocaleString()} closed, $${pipelineTotal.toLocaleString()} in pipeline. To hit your $${agentProfile.goalIncome.toLocaleString()} goal, you need to close an additional $${remaining.toLocaleString()} this year.`,
      });
    }
  }

  // Trigger 5: strategy diversity — quarterly, when the pipeline is
  // concentrated in one product type. The doc's example is 5 of 6 (~83%) and
  // gives no numeric threshold, so 75% across 3+ estimated scenarios is used.
  const typeByScenario = new Map<string, ProductType>();
  for (const prospect of prospects) {
    const estimates = await prisma.scenarioStrategyEstimate.findMany({
      where: { scenarioId: prospect.scenario.id },
    });
    if (estimates.length > 0) typeByScenario.set(prospect.scenario.id, estimates[0].productType);
  }
  if (typeByScenario.size >= 3) {
    const counts = new Map<ProductType, number>();
    for (const type of typeByScenario.values()) counts.set(type, (counts.get(type) ?? 0) + 1);
    const [dominantType, dominantCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (dominantCount / typeByScenario.size >= 0.75) {
      if (await surfaceWithCap(userId, "nudge.strategy_diversity", userId, 90)) {
        nudges.push({
          type: "strategy_diversity",
          message: `${dominantCount} of your ${typeByScenario.size} active scenarios are ${PRODUCT_TYPE_LABELS[dominantType]}. Consider whether any of your qualified-fund-heavy prospects would benefit from a repositioning strategy — that's typically 2-3x the commission value.`,
        });
      }
    }
  }

  return { nudges, agingMessages };
}
