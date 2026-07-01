import { prisma } from "@/lib/prisma";
import { computeExpectedCommission, computeExpectedCommissionValue } from "@/lib/commission";
import { computeBookOfBusinessOpportunity } from "@/lib/book-of-business";
import { getAgentProfile } from "@/lib/onboarding";
import type { ProductType, Scenario, ScenarioStatus } from "@/generated/prisma/client";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CLOSED_STATUSES: ScenarioStatus[] = ["closed_won", "closed_lost"];

export interface DashboardScenarioLine {
  scenario: Scenario;
  expectedCommission: number;
  closeRate: number | null;
  expectedCommissionValue: number | null;
}

function valueOf(line: DashboardScenarioLine) {
  return line.expectedCommissionValue ?? line.expectedCommission;
}

async function scenarioLinesFor(userId: string, scenarios: Scenario[]): Promise<DashboardScenarioLine[]> {
  return Promise.all(
    scenarios.map(async (scenario) => {
      const { expectedCommission, closeRate, expectedCommissionValue } = await computeExpectedCommissionValue(
        userId,
        scenario,
      );
      return { scenario, expectedCommission, closeRate, expectedCommissionValue };
    }),
  );
}

// docs/07-progress-dashboard-math.md section 5, Widget 1: "active" scenarios
// with activity in the last 7 days. There is no separate activity log or
// meeting scheduler yet, so `updatedAt` stands in for "logged activity" —
// noted as a simplification until those features exist.
export async function computeThisWeeksPipeline(userId: string) {
  const scenarios = await prisma.scenario.findMany({
    where: {
      userId,
      status: { notIn: CLOSED_STATUSES },
      updatedAt: { gte: new Date(Date.now() - WEEK_MS) },
    },
    orderBy: { updatedAt: "desc" },
  });
  const lines = await scenarioLinesFor(userId, scenarios);
  lines.sort((a, b) => valueOf(b) - valueOf(a));
  const total = lines.reduce((sum, line) => sum + valueOf(line), 0);
  return { lines, total };
}

// docs/07-progress-dashboard-math.md section 5, Widget 2: every scenario
// created YTD, broken down by status.
export async function computeThisYearsPipeline(userId: string) {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const scenarios = await prisma.scenario.findMany({
    where: { userId, createdAt: { gte: yearStart } },
    orderBy: { createdAt: "desc" },
  });
  const lines = await scenarioLinesFor(userId, scenarios);
  const total = lines.reduce((sum, line) => sum + valueOf(line), 0);

  const byStatus = {
    draft: { count: 0, total: 0 },
    active: { count: 0, total: 0 },
    in_underwriting: { count: 0, total: 0 },
    closed_won: { count: 0, total: 0 },
    closed_lost: { count: 0, total: 0 },
  } satisfies Record<ScenarioStatus, { count: number; total: number }>;

  for (const line of lines) {
    const bucket = byStatus[line.scenario.status];
    bucket.count += 1;
    bucket.total += valueOf(line);
  }

  return { lines, total, byStatus };
}

// docs/07-progress-dashboard-math.md section 5, Widget 4: actual commissions
// for scenarios closed-won this year, broken down by product type.
export async function computeClosedThisYear(userId: string) {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const scenarios = await prisma.scenario.findMany({
    where: { userId, status: "closed_won", closedAt: { gte: yearStart } },
    orderBy: { closedAt: "desc" },
  });

  const byProductType = {} as Record<ProductType, number>;
  let total = 0;
  for (const scenario of scenarios) {
    const { lines } = await computeExpectedCommission(userId, scenario.id);
    for (const line of lines) {
      total += line.amount;
      byProductType[line.estimate.productType] = (byProductType[line.estimate.productType] ?? 0) + line.amount;
    }
  }

  return { scenarios, total, byProductType };
}

export async function computeDashboard(userId: string) {
  const [thisWeek, thisYear, closedThisYear, agentProfile] = await Promise.all([
    computeThisWeeksPipeline(userId),
    computeThisYearsPipeline(userId),
    computeClosedThisYear(userId),
    getAgentProfile(userId),
  ]);

  return {
    thisWeek,
    thisYear,
    closedThisYear,
    bookOpportunity: computeBookOfBusinessOpportunity(agentProfile),
  };
}
