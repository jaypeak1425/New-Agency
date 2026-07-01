import { prisma } from "@/lib/prisma";
import type { Scenario, Strategy } from "@/generated/prisma/client";

export type StrategyEligibility = "eligible" | "needs_more_info" | "not_eligible";

export interface StrategyRecommendation {
  strategy: Strategy;
  eligibility: StrategyEligibility;
}

// Per-strategy gate logic, hand-written from each documented strategy's
// matchingParameters (see prisma/strategy-library-data.ts) against the
// structured scenario fields (docs/03-intake-flow.md's 10 questions +
// docs/advanced-case-design-framework.md section 2's optional HNW
// follow-ups). Every strategy not listed here (i.e. every pending_content
// strategy) is never evaluated — Brain Lock (CLAUDE.md) means only
// documented strategies are ever surfaced.
type Gate = (scenario: Scenario) => StrategyEligibility;

function fromRequirements(
  scenario: Scenario,
  requiredFields: Array<unknown>,
  isEligible: () => boolean,
): StrategyEligibility {
  if (requiredFields.some((field) => field === null || field === undefined)) {
    return "needs_more_info";
  }
  return isEligible() ? "eligible" : "not_eligible";
}

const GATES: Record<string, Gate> = {
  "survivorship-second-to-die": (s) =>
    fromRequirements(
      s,
      [s.maritalStatus, s.illiquidNetWorth],
      () => s.maritalStatus === "married" && s.illiquidNetWorth === true,
    ),

  "premium-financed-life-insurance": (s) =>
    fromRequirements(
      s,
      [s.illiquidNetWorth, s.fundingPreference],
      () => s.illiquidNetWorth === true && s.fundingPreference === "financing_or_loan",
    ),

  "ilit-foundation-wrapper": (s) =>
    // docs/advanced-case-design-framework.md section 5: "ILIT auto-included
    // as the default wrapper whenever federal exemption is exceeded."
    fromRequirements(s, [s.estateExceedsExemption], () => s.estateExceedsExemption === true),

  slat: (s) =>
    fromRequirements(
      s,
      [s.maritalStatus, s.estateExceedsExemption, s.controlPreference],
      () =>
        s.maritalStatus === "married" &&
        s.estateExceedsExemption === true &&
        s.controlPreference === "retained_access_or_control",
    ),

  "dynasty-gst-trust": (s) =>
    fromRequirements(
      s,
      [s.beneficiaryStructure],
      () => s.beneficiaryStructure === "grandchildren_multigenerational",
    ),

  "private-split-dollar-loan-regime": (s) =>
    fromRequirements(
      s,
      [s.fundingPreference],
      () => s.fundingPreference === "financing_or_loan" && s.existingStructures.includes("ilit"),
    ),

  "installment-sale-idgt": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus ?? s.illiquidNetWorth, s.controlPreference],
      () =>
        (s.businessOwnerStatus === "business_owner" || s.illiquidNetWorth === true) &&
        s.controlPreference === "retained_access_or_control" &&
        s.existingStructures.includes("grantor_trust"),
    ),

  "wealth-replacement-crt": (s) =>
    fromRequirements(
      s,
      [s.concentratedLowBasisPosition],
      () => s.concentratedLowBasisPosition === true && s.primaryGoals.includes("charitable_intent"),
    ),

  "flp-fllc-discounted-gifting": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus ?? s.illiquidNetWorth, s.controlPreference],
      () =>
        (s.businessOwnerStatus === "business_owner" || s.illiquidNetWorth === true) &&
        s.controlPreference === "retained_access_or_control",
    ),

  "section-162-executive-bonus-reba": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus, s.fundingPreference],
      () =>
        s.businessOwnerStatus === "business_owner" &&
        (s.keyEmployeesCount ?? 0) > 0 &&
        s.fundingPreference === "employer_funded",
    ),
};

export async function recommendStrategies(scenario: Scenario): Promise<StrategyRecommendation[]> {
  const documented = await prisma.strategy.findMany({
    where: { status: "documented" },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  const results = documented
    .map((strategy) => {
      const gate = GATES[strategy.slug];
      const eligibility: StrategyEligibility = gate ? gate(scenario) : "needs_more_info";
      return { strategy, eligibility };
    })
    .filter((r) => r.eligibility !== "not_eligible");

  await prisma.auditLog.create({
    data: {
      actorId: scenario.userId,
      action: "scenario.recommendation_computed",
      target: scenario.id,
      metadata: {
        eligible: results.filter((r) => r.eligibility === "eligible").map((r) => r.strategy.slug),
        needsMoreInfo: results
          .filter((r) => r.eligibility === "needs_more_info")
          .map((r) => r.strategy.slug),
      },
    },
  });

  return results;
}
