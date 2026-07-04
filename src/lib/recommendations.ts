import { prisma } from "@/lib/prisma";
import type {
  AnnuityIntake,
  LifeUnderwritingIntake,
  Scenario,
  Strategy,
} from "@/generated/prisma/client";
import { checkHardRules, type HardRuleViolation } from "@/lib/hard-rules";
import { estimateUnderwritingClass } from "@/lib/underwriting";

export type StrategyEligibility = "eligible" | "needs_more_info" | "not_eligible";

export interface StrategyRecommendation {
  strategy: Strategy;
  eligibility: StrategyEligibility;
  hardRuleViolations: HardRuleViolation[];
}

// CLAUDE.md's 9 hard rules (src/lib/hard-rules.ts), wired per strategy:
//  - Rule 4 (ILIT must be original owner to avoid the §2035 3-year lookback)
//    applies to every ILIT-chassis strategy in the library.
//  - Rule 2 (§1035 is non-qualified only) applies to the exchange-based
//    annuity strategies — a qualified source of funds means the §1035 paths
//    are off-limits and rollover/transfer rules apply instead.
// Rule 1 (no direct annuity→life §1035) is enforced structurally: no
// strategy card in the locked library describes that exchange, and the
// SPIA-bridge cards (QWT, Annuity Rescue) encode the only valid path.
// Rules 5/6/7/9 (COLI, MEC, §162, §415(b)) have no seeded strategy or
// scenario field to check against yet — wiring them here would be a no-op.
const ILIT_CHASSIS_SLUGS = new Set([
  "ilit-foundation-wrapper",
  "estate-funding",
  "quiet-wealth-transfer",
  "rmd-repositioning",
  "qprt-insurance-hedge",
  "clat-wealth-replacement",
]);
const SECTION_1035_SLUGS = new Set(["annuity-rescue", "qualified-ltc"]);
// Employer-owned life insurance designs: §101(j) notice-and-consent must be
// signed BEFORE issue (hard rule 5), and no scenario field can prove that
// yet — so the rule surfaces as a standing pre-issue guardrail on every
// EOLI recommendation rather than a conditional check.
const EOLI_SLUGS = new Set([
  "key-person-life-insurance",
  "coli-corporate-reserve",
  "nqdc-serp-coli",
  "endorsement-split-dollar",
]);

function hardRuleViolationsFor(
  strategy: Strategy,
  scenario: Scenario,
  annuityIntake: AnnuityIntake | null,
): HardRuleViolation[] {
  if (ILIT_CHASSIS_SLUGS.has(strategy.slug) && scenario.existingPolicyTransfer !== null) {
    return checkHardRules({
      ilit: { isOriginalOwner: scenario.existingPolicyTransfer === false },
    }).violations;
  }
  if (SECTION_1035_SLUGS.has(strategy.slug) && annuityIntake?.sourceOfFunds === "qualified") {
    return checkHardRules({
      exchange: { from: "annuity", to: "annuity", fundsQualified: true },
    }).violations;
  }
  if (EOLI_SLUGS.has(strategy.slug)) {
    return checkHardRules({ coli: {} }).violations;
  }
  return [];
}

// Per-strategy gate logic, hand-written from each documented strategy's
// matchingParameters (see prisma/strategy-library-data.ts) against the
// structured scenario fields (docs/03-intake-flow.md's 10 questions +
// docs/advanced-case-design-framework.md section 2's optional HNW
// follow-ups). Every strategy not listed here (i.e. every pending_content
// strategy) is never evaluated — Brain Lock (CLAUDE.md) means only
// documented strategies are ever surfaced.
type Gate = (scenario: Scenario, annuityIntake: AnnuityIntake | null) => StrategyEligibility;

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

export const GATES: Record<string, Gate> = {
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

  // ---- The 7 researched core strategies (gates hand-written from each
  // card's matchingParameters in prisma/strategy-library-data.ts; live only
  // once the card is approved via the admin sign-off, since the engine still
  // queries status = documented only) ----

  "estate-funding": (s) =>
    // Single-life / first-death liquidity — the married-couple version of
    // this need is survivorship-second-to-die's gate.
    fromRequirements(
      s,
      [s.estateExceedsExemption, s.illiquidNetWorth, s.maritalStatus],
      () =>
        s.estateExceedsExemption === true &&
        s.illiquidNetWorth === true &&
        s.maritalStatus !== "married",
    ),

  grats: (s) =>
    fromRequirements(
      s,
      [s.estateExceedsExemption, s.businessOwnerStatus ?? s.concentratedLowBasisPosition],
      () =>
        s.estateExceedsExemption === true &&
        (s.businessOwnerStatus === "business_owner" || s.concentratedLowBasisPosition === true),
    ),

  "quiet-wealth-transfer": (s) =>
    fromRequirements(
      s,
      [s.qualifiedFundsEstimate],
      () => s.qualifiedFundsEstimate === "over_500k" && hasLegacyGoal(s),
    ),

  "rmd-repositioning": (s) =>
    // RMD_BEGINNING_AGE is the floor; the shared life-insurance age ceiling
    // (80) still applies above, so the fully-eligible window is 73–80.
    fromRequirements(
      s,
      [s.qualifiedFundsEstimate, s.primaryAge],
      () =>
        s.qualifiedFundsEstimate === "over_500k" &&
        (s.primaryAge ?? 0) >= RMD_BEGINNING_AGE &&
        hasLegacyGoal(s),
    ),

  "roth-plus-life": (s) =>
    fromRequirements(
      s,
      [s.qualifiedFundsEstimate],
      () =>
        s.qualifiedFundsEstimate === "over_500k" &&
        (hasLegacyGoal(s) || s.primaryGoals.includes("retirement_income")),
    ),

  "annuity-rescue": (s, ai) =>
    // Needs the annuity intake — an existing contract is the whole trigger.
    // A qualified source of funds stays eligible (rollover path), with the
    // rule-2 §1035 guardrail surfaced via hardRuleViolationsFor.
    fromRequirements(
      s,
      [ai?.existingAnnuityContractsNotes, ai?.sourceOfFunds],
      () => Boolean(ai?.existingAnnuityContractsNotes?.trim()),
    ),

  "qualified-ltc": (s, ai) => {
    // Two documented funding paths: an existing (gain-heavy) annuity via the
    // PPA 2006 §1035 route, or $500K+ qualified funds via distributions.
    if (ai?.existingAnnuityContractsNotes?.trim()) return "eligible";
    if (s.qualifiedFundsEstimate === null || s.primaryAge === null) return "needs_more_info";
    return s.qualifiedFundsEstimate === "over_500k" && s.primaryAge >= 60
      ? "eligible"
      : "not_eligible";
  },

  // ---- The 2026-07-02 library additions (business owner, HNW trust
  // structures, and the Family/Legacy avatar's first strategy) ----

  "buy-sell-life-insurance": (s) =>
    // Q6 free-text is the co-owner signal: answered-and-empty means solo.
    fromRequirements(
      s,
      [s.businessOwnerStatus, s.coOwnersNotes],
      () => s.businessOwnerStatus === "business_owner" && Boolean(s.coOwnersNotes?.trim()),
    ),

  "key-person-life-insurance": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus, s.keyEmployeesCount],
      () => s.businessOwnerStatus === "business_owner" && (s.keyEmployeesCount ?? 0) > 0,
    ),

  "coli-corporate-reserve": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus, s.businessStructure],
      () => s.businessOwnerStatus === "business_owner" && s.businessStructure !== "sole_prop",
    ),

  "nqdc-serp-coli": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus, s.keyEmployeesCount, s.fundingPreference],
      () =>
        s.businessOwnerStatus === "business_owner" &&
        (s.keyEmployeesCount ?? 0) > 0 &&
        s.fundingPreference === "employer_funded",
    ),

  "endorsement-split-dollar": (s) =>
    fromRequirements(
      s,
      [s.businessOwnerStatus, s.keyEmployeesCount, s.fundingPreference],
      () =>
        s.businessOwnerStatus === "business_owner" &&
        (s.keyEmployeesCount ?? 0) > 0 &&
        s.fundingPreference === "employer_funded",
    ),

  "qprt-insurance-hedge": (s) =>
    fromRequirements(
      s,
      [s.estateExceedsExemption, s.illiquidNetWorth],
      () => s.estateExceedsExemption === true && s.illiquidNetWorth === true,
    ),

  ppli: (s) =>
    fromRequirements(
      s,
      [s.netWorthEstimate],
      () => s.netWorthEstimate === "over_5m" && hasLegacyGoal(s),
    ),

  "clat-wealth-replacement": (s) =>
    fromRequirements(
      s,
      [s.estateExceedsExemption],
      () => s.estateExceedsExemption === true && s.primaryGoals.includes("charitable_intent"),
    ),

  "family-income-legacy": (s) => {
    // The door-opener tier: HNW net worth routes to the estate strategies
    // instead, dependents under 18 is the strongest signal, legacy intent
    // qualifies on its own.
    if (s.netWorthEstimate === "over_5m") return "not_eligible";
    if (s.hasDependentsUnder18 === true) return "eligible";
    if (s.hasDependentsUnder18 === null) return "needs_more_info";
    return s.primaryGoals.includes("legacy") ? "eligible" : "not_eligible";
  },
};

// docs/03-intake-flow.md Q8 vocabulary — the legacy-intent cluster the three
// Qualified-Fund-Heavy repositioning strategies key off.
function hasLegacyGoal(s: Scenario): boolean {
  return (
    s.primaryGoals.includes("legacy") ||
    s.primaryGoals.includes("estate_planning") ||
    s.primaryGoals.includes("minimize_estate_tax")
  );
}

// SECURE 2.0 (2022): required beginning age is 73 (born 1951–1959), rising
// to 75 for those born 1960+ starting 2033. The gate uses 73 — the earliest
// age RMDs can already be forced.
const RMD_BEGINNING_AGE = 73;

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
// "Atlas pivots to the annuity universe" when the age/health gate fails.
// Annuity Rescue and Qualified LTC are the two library strategies that don't
// hinge on the client being life-insurance underwritable (annuity→annuity
// and annuity→LTC-hybrid designs; hybrid LTC underwriting is typically
// simplified) — so when the pivot fires, those are the strategies the engine
// evaluates instead of returning nothing. Still Brain-Locked: they surface
// only while their status is documented (i.e. after the admin sign-off).
const PIVOT_SAFE_SLUGS = ["annuity-rescue", "qualified-ltc"];

function assessPivot(scenario: Scenario): PivotResult {
  const reasons: string[] = [];

  if (scenario.primaryAge !== null && scenario.primaryAge > LIFE_INSURANCE_AGE_CEILING) {
    reasons.push(`age ${scenario.primaryAge} is outside the range for life-insurance-funded strategies`);
  }

  if (reasons.length === 0) {
    return { triggered: false, reasons: [], message: null };
  }

  return { triggered: true, reasons, message: null };
}

function buildPivotMessage(
  scenario: Scenario,
  reasons: string[],
  pivotRecommendations: StrategyRecommendation[],
): string {
  const healthNote =
    scenario.healthRating === "health_issues" ? " and the health profile is a further barrier" : "";
  const preamble =
    `This client's ${reasons.join("; ")}${healthNote}. The life-insurance-funded strategies in ` +
    "this library don't fit, so Atlas is pivoting to the annuity universe " +
    "(docs/04-field-underwriting.md section 6).";

  if (pivotRecommendations.some((r) => r.eligibility === "eligible")) {
    return `${preamble} The annuity-side strategies below fit what you've told me so far.`;
  }
  if (pivotRecommendations.length > 0) {
    return (
      `${preamble} The annuity-side strategies need more information — complete the annuity ` +
      "intake (existing contracts, source of funds) to confirm the fit."
    );
  }
  return (
    `${preamble} No annuity-side strategy is live in the locked library yet (Annuity Rescue and ` +
    "Qualified LTC are drafted but awaiting the pre-launch sign-off), so Atlas can't recommend " +
    "one — flag this case for manual review."
  );
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

export async function recommendStrategies(
  scenario: Scenario,
  lifeUnderwritingIntake: LifeUnderwritingIntake | null = null,
): Promise<RecommendationResult> {
  const pivot = assessPivot(scenario);

  // docs/04-field-underwriting.md section 3: once the full life underwriting
  // intake exists, use the real class estimate instead of the coarse
  // healthRating-only proxy from Session 7.
  const underwritingEstimate = estimateUnderwritingClass(scenario, lifeUnderwritingIntake);
  const healthConcernNote = underwritingEstimate
    ? `Likely underwriting class: ${underwritingEstimate.label} (${underwritingEstimate.confidence} confidence)${
        underwritingEstimate.rationale.length > 0 ? ` — ${underwritingEstimate.rationale.join("; ")}` : ""
      }. This is an estimate, not a guarantee — the carrier's underwriter sets the actual class.`
    : scenario.healthRating === "health_issues"
      ? "Health profile suggests this may face a higher underwriting class (possibly Table-rated) — confirm with a full underwriting intake before quoting."
      : null;

  const annuityIntake = await prisma.annuityIntake.findUnique({
    where: { scenarioId: scenario.id },
  });

  if (pivot.triggered) {
    // The pivot doesn't end the recommendation — it narrows the library to
    // the annuity-side strategies that don't require life underwriting.
    const pivotDocumented = await prisma.strategy.findMany({
      where: { status: "documented", slug: { in: PIVOT_SAFE_SLUGS } },
      orderBy: { name: "asc" },
    });
    const recommendations = pivotDocumented
      .map((strategy) => {
        const gate = GATES[strategy.slug];
        const eligibility: StrategyEligibility = gate
          ? gate(scenario, annuityIntake)
          : "needs_more_info";
        return {
          strategy,
          eligibility,
          hardRuleViolations: hardRuleViolationsFor(strategy, scenario, annuityIntake),
        };
      })
      .filter((r) => r.eligibility !== "not_eligible");

    pivot.message = buildPivotMessage(scenario, pivot.reasons, recommendations);

    await prisma.auditLog.create({
      data: {
        actorId: scenario.userId,
        action: "scenario.pivot_triggered",
        target: scenario.id,
        metadata: {
          reasons: pivot.reasons,
          annuityRecommendations: recommendations.map((r) => ({
            slug: r.strategy.slug,
            eligibility: r.eligibility,
          })),
        },
      },
    });
    return { pivot, recommendations, healthConcernNote };
  }

  const documented = await prisma.strategy.findMany({
    where: { status: "documented" },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });

  const recommendations = documented
    .map((strategy) => {
      const gate = GATES[strategy.slug];
      const eligibility: StrategyEligibility = gate
        ? gate(scenario, annuityIntake)
        : "needs_more_info";
      return {
        strategy,
        eligibility,
        hardRuleViolations: hardRuleViolationsFor(strategy, scenario, annuityIntake),
      };
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
