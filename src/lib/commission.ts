import { prisma } from "@/lib/prisma";
import { getScenarioForUser } from "@/lib/scenarios";
import type { ProductType, ScenarioStrategyEstimate, Strategy } from "@/generated/prisma/client";

// docs/07-progress-dashboard-math.md section 2's default commission rate
// table. COLI is a percentage of face amount; every other product type is a
// percentage of annual premium.
export const DEFAULT_COMMISSION_RATES: Record<ProductType, number> = {
  permanent_life: 0.55,
  term_life: 0.5,
  survivorship_life: 0.55,
  annuity: 0.02,
  coli_face_amount: 0.005,
  executive_bonus_162: 0.55,
  disability_income: 0.5,
  ltc_hybrid: 0.5,
};

export function commissionRateFor(productType: ProductType, overridePercent: number | null): number {
  // docs/07 edge case 1: the agent's override is a single flat rate used
  // everywhere, not a per-product override table.
  return overridePercent ?? DEFAULT_COMMISSION_RATES[productType];
}

export interface StrategyCommissionLine {
  strategy: Strategy;
  estimate: ScenarioStrategyEstimate;
  rate: number;
  amount: number;
}

export function computeStrategyCommission(
  estimate: ScenarioStrategyEstimate & { strategy: Strategy },
  overridePercent: number | null,
): StrategyCommissionLine {
  const rate = commissionRateFor(estimate.productType, overridePercent);
  const base =
    estimate.productType === "coli_face_amount" ? (estimate.faceAmount ?? 0) : (estimate.annualPremium ?? 0);
  return { strategy: estimate.strategy, estimate, rate, amount: Math.round(base * rate) };
}

export async function getStrategyEstimatesForScenario(userId: string, scenarioId: string) {
  await getScenarioForUser(userId, scenarioId);
  return prisma.scenarioStrategyEstimate.findMany({
    where: { scenarioId },
    include: { strategy: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveStrategyEstimate(
  userId: string,
  scenarioId: string,
  strategyId: string,
  productType: ProductType,
  annualPremium: number | null,
  faceAmount: number | null,
) {
  await getScenarioForUser(userId, scenarioId);

  const estimate = await prisma.scenarioStrategyEstimate.upsert({
    where: { scenarioId_strategyId: { scenarioId, strategyId } },
    create: { scenarioId, strategyId, productType, annualPremium, faceAmount },
    update: { productType, annualPremium, faceAmount },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.commission_estimate_saved",
      target: scenarioId,
      metadata: { strategyId, productType, annualPremium, faceAmount },
    },
  });

  return estimate;
}

// docs/07-progress-dashboard-math.md section 2's "Expected Commission
// Formula": sum of (premium x rate) across every strategy in the stack.
export async function computeExpectedCommission(userId: string, scenarioId: string) {
  const [estimates, agentProfile] = await Promise.all([
    getStrategyEstimatesForScenario(userId, scenarioId),
    prisma.agentProfile.findUnique({ where: { userId } }),
  ]);

  const overridePercent = agentProfile?.commissionRateOverridePercent ?? null;
  const lines = estimates.map((estimate) => computeStrategyCommission(estimate, overridePercent));
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return { lines, total, overridePercent };
}
