import type { Avatar, Scenario } from "@/generated/prisma/client";

// docs/03-intake-flow.md section 3 + CLAUDE.md's avatar priority order
// (Business Owner -> HNW -> Qualified Fund Heavy -> Family/Legacy).
// "Prospects usually stack multiple" — this returns every avatar that
// activates, not just the top match.
export interface AvatarClassification {
  activated: Avatar[];
  // Avatars the doc's signals require net worth / qualified-fund data we
  // don't have yet — mirrors the worked example's "I don't have visibility
  // into their qualified balances" follow-up rather than guessing.
  needsMoreInfo: Avatar[];
  // CLAUDE.md: "$500K-$1.5M earners get an OBBBA AMT-trap diagnostic flag."
  // incomeRevenueRange is a bucket, not an exact figure, so this is a
  // best-effort flag on overlapping bands, not a precise trigger.
  amtTrapFlag: boolean;
  amtTrapNote: string | null;
}

const PRIORITY_ORDER: Avatar[] = [
  "business_owner",
  "high_net_worth",
  "qualified_fund_heavy",
  "family_legacy",
];

export function classifyAvatars(scenario: Scenario): AvatarClassification {
  const activatedSet = new Set<Avatar>();
  const needsMoreInfoSet = new Set<Avatar>();

  // Business Owner: "has a business with co-owners"
  if (scenario.businessOwnerStatus === "business_owner" && scenario.coOwnersNotes) {
    activatedSet.add("business_owner");
  }

  // High Net Worth: "Net worth > $2M (or self-reported)"
  if (scenario.netWorthEstimate === "range_2m_5m" || scenario.netWorthEstimate === "over_5m") {
    activatedSet.add("high_net_worth");
  } else if (!scenario.netWorthEstimate) {
    needsMoreInfoSet.add("high_net_worth");
  }

  // Qualified Fund Heavy: "$500K+ in qualified funds (self-reported)"
  if (scenario.qualifiedFundsEstimate === "over_500k") {
    activatedSet.add("qualified_fund_heavy");
  } else if (!scenario.qualifiedFundsEstimate) {
    needsMoreInfoSet.add("qualified_fund_heavy");
  }

  // Family/Legacy: "Has dependents under 18 OR explicit legacy intent"
  if (scenario.hasDependentsUnder18 === true || scenario.primaryGoals.includes("legacy")) {
    activatedSet.add("family_legacy");
  } else if (scenario.hasDependentsUnder18 === null && !scenario.primaryGoals.includes("legacy")) {
    needsMoreInfoSet.add("family_legacy");
  }

  // Business Owner has no "needs more info" state — it's fully answerable
  // from Q4 + Q6, both part of the required 10 questions.

  let amtTrapFlag = false;
  let amtTrapNote: string | null = null;
  if (
    scenario.incomeRevenueRange === "range_250k_1m" ||
    scenario.incomeRevenueRange === "range_1m_5m"
  ) {
    amtTrapFlag = true;
    // Real 2026 figures from src/lib/tax-reference.ts (Rev. Proc. 2025-32 +
    // OBBBA): this is WHY the $500K–$1.5M band is a trap, not just a label.
    amtTrapNote =
      "Income/revenue band overlaps the $500K–$1.5M OBBBA AMT-trap zone. The 2026 mechanics: " +
      "the AMT exemption ($90,100 single / $140,200 joint) phases out at 50¢ per dollar of AMTI " +
      "above $500K single / $1M joint — twice the pre-OBBBA speed — so a joint filer's exemption " +
      "is fully gone by roughly $1.28M and the effective marginal AMT rate in the phase-out band " +
      "runs ~35–42%. Deduction-timing, exercise-timing, and Roth-conversion sizing all interact " +
      "with it. Confirm the exact income figure and run the AMT diagnostic with the client's CPA " +
      "before quoting after-tax outcomes.";
  }

  return {
    activated: PRIORITY_ORDER.filter((avatar) => activatedSet.has(avatar)),
    needsMoreInfo: PRIORITY_ORDER.filter((avatar) => needsMoreInfoSet.has(avatar)),
    amtTrapFlag,
    amtTrapNote,
  };
}
