import { prisma } from "@/lib/prisma";
import type { Scenario, Strategy } from "@/generated/prisma/client";
import { checkHardRules, type HardRuleViolation } from "@/lib/hard-rules";

export type StrategyEligibility = "eligible" | "needs_more_info" | "not_eligible";

export interface StrategyRecommendation {
  strategy: Strategy;
  eligibility: StrategyEligibility;
  hardRuleViolations: HardRuleViolation[];
}

// CLAUDE.md's 9 hard rules (src/lib/hard-rules.ts) guard against annuity
// exchanges, COLI, MEC, and qualified-plan life insurance — none of which
// exist in the 17-strategy library yet (COLI isn't a seeded strategy at all;
// the annuity-side strategies are all pending_content). Rule 4 (ILIT must be
// original owner to avoid the §2035 3-year lookback) is the one rule that's
// structurally applicable right now, since ilit-foundation-wrapper is
// documented. The other 8 rules have nothing to check against yet — wiring
// them in now would be a no-op, not real enforcement.
function hardRuleViolationsFor(strategy: Strategy, scenario: Scenario): HardRuleViolation[] {
  if (strategy.slug !== "ilit-foundation-wrapper" || scenario.existingPolicyTransfer === null) {
    return [];
  }
  return checkHardRules({
    ilit: { isOriginalOwner: scenario.existingPolicyTransfer === false },
  }).violations;
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

// docs/04-field-underwriting.md section 5 ("The Eligibility Gates") is the
// only doc that gives a concrete, sourced age threshold: "Age > 80 for most
// life strategies." Every documented strategy in this library is
// life-insurance-funded, so this gate applies across all of them uniformly
// (none of them carry a more specific override like the doc's "> 75 for
// buy-sell," since "buy-sell" isn't one of the 17 seeded strategies).
const LIFE_INSURANCE_AGE_CEILING = 80;

export interface PivotResult {
  triggered: boolean;
  reasons: string[];
  message: string | null;
}

// docs/03-intake-flow.md section 5 + docs/04-field-underwriting.md section 6:
// "Atlas pivots to the annuity universe" when the age/health gate fails. None
// of the 17 seeded strategies are annuity strategies yet (QWT, Annuity
// Rescue, and Qualified LTC — the natural annuity-side pivots — are all
// pending_content), so the pivot message says so honestly instead of
// recommending something that isn't in the locked library.
function assessPivot(scenario: Scenario): PivotResult {
  const reasons: string[] = [];

  if (scenario.primaryAge !== null && scenario.primaryAge > LIFE_INSURANCE_AGE_CEILING) {
    reasons.push(`age ${scenario.primaryAge} is outside the range for life-insurance-funded strategies`);
  }

  if (reasons.length === 0) {
    return { triggered: false, reasons: [], message: null };
  }

  const healthNote =
    scenario.healthRating === "health_issues" ? " and the health profile is a further barrier" : "";

  return {
    triggered: true,
    reasons,
    message:
      `This client's ${reasons.join("; ")}${healthNote}. The life-insurance-funded strategies in ` +
      "this library don't fit. The right pivot is the annuity universe (SPIA, QLAC, deferred " +
      "annuity) per docs/04-field-underwriting.md — but Quiet Wealth Transfer, Annuity Rescue, and " +
      "Qualified LTC are still pending_content in the strategy library (no real mechanics/legal " +
      "basis documented yet), so Atlas can't recommend one from the locked library. Flag this case " +
      "for manual review until that content is supplied.",
  };
}

export interface RecommendationResult {
  pivot: PivotResult;
  recommendations: StrategyRecommendation[];
  // docs/04-field-underwriting.md section 3 + edge case 4: a coarse
  // health-issues flag surfaces as a softer underwriting-class warning
  // rather than a hard exclusion — a real Table-rating estimate needs the
  // full 12-question life underwriting intake (Session 10), not built yet.
  healthConcernNote: string | null;
}

export async function recommendStrategies(scenario: Scenario): Promise<RecommendationResult> {
  const pivot = assessPivot(scenario);

  const healthConcernNote =
    scenario.healthRating === "health_issues"
      ? "Health profile suggests this may face a higher underwriting class (possibly Table-rated) — confirm with a full underwriting intake before quoting."
      : null;

  if (pivot.triggered) {
    await prisma.auditLog.create({
      data: {
        actorId: scenario.userId,
        action: "scenario.pivot_triggered",
        target: scenario.id,
        metadata: { reasons: pivot.reasons },
      },
    });
    return { pivot, recommendations: [], healthConcernNote };
  }

  const documented = await prisma.strategy.findMany({
    where: { status: "documented" },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  const recommendations = documented
    .map((strategy) => {
      const gate = GATES[strategy.slug];
      const eligibility: StrategyEligibility = gate ? gate(scenario) : "needs_more_info";
      return { strategy, eligibility, hardRuleViolations: hardRuleViolationsFor(strategy, scenario) };
    })
    .filter((r) => r.eligibility !== "not_eligible");

  await prisma.auditLog.create({
    data: {
      actorId: scenario.userId,
      action: "scenario.recommendation_computed",
      target: scenario.id,
      metadata: {
        eligible: recommendations
          .filter((r) => r.eligibility === "eligible")
          .map((r) => r.strategy.slug),
        needsMoreInfo: recommendations
          .filter((r) => r.eligibility === "needs_more_info")
          .map((r) => r.strategy.slug),
        hardRuleViolations: recommendations
          .filter((r) => r.hardRuleViolations.length > 0)
          .map((r) => ({ slug: r.strategy.slug, violations: r.hardRuleViolations.map((v) => v.rule) })),
      },
    },
  });

  return { pivot, recommendations, healthConcernNote };
}
