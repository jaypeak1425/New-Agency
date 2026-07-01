import type { LifeUnderwritingIntake, Scenario, Strategy, User } from "@/generated/prisma/client";
import type { AvatarClassification } from "@/lib/avatars";
import type { UnderwritingEstimate } from "@/lib/underwriting";

// docs/06-wholesaler-handoff.md section 2's full template needs commission
// math (explicitly Phase 4 — CLAUDE.md's "Progress tracker + revenue
// dashboard" layer, not built yet) and only reaches Variations A/B (single-
// strategy / multi-strategy-stack); Variations C/D (annuity pivot, qualified
// repositioning) need strategies that are still pending_content. This builds
// the sections that current data actually supports.
const AVATAR_LABELS: Record<string, string> = {
  business_owner: "Business Owner",
  high_net_worth: "High Net Worth",
  qualified_fund_heavy: "Qualified Fund Heavy",
  family_legacy: "Family / Legacy",
};

// Strategies that mechanically require an ILIT/irrevocable trust as owner —
// docs/03-intake-flow.md section 6 + docs/04-field-underwriting.md section 7's
// COI action. section-162-executive-bonus-reba is personally owned by the
// executive, no trust — but needs a CPA for the deductibility/compensation
// sign-off instead.
const TRUST_COI_SLUGS = new Set([
  "ilit-foundation-wrapper",
  "slat",
  "dynasty-gst-trust",
  "private-split-dollar-loan-regime",
  "installment-sale-idgt",
  "wealth-replacement-crt",
  "flp-fllc-discounted-gifting",
  "survivorship-second-to-die",
  "premium-financed-life-insurance",
]);
const CPA_COI_SLUGS = new Set(["section-162-executive-bonus-reba"]);

export interface HandoffContent {
  clientProfileLines: string[];
  businessContextLines: string[];
  scenarioSummaryLines: string[];
  strategyRequestedLines: string[];
  coiNotes: string[];
  complianceNote: string;
  agentContactLines: string[];
}

export function buildHandoffContent(
  scenario: Scenario,
  classification: AvatarClassification,
  eligibleStrategies: Strategy[],
  lifeUnderwritingIntake: LifeUnderwritingIntake | null,
  underwritingEstimate: UnderwritingEstimate | null,
  agent: User,
): HandoffContent {
  const clientProfileLines = [
    `Age: ${scenario.primaryAge ?? "not given"}`,
    `Health: ${scenario.healthRating ?? "not given"}${scenario.healthNotes ? ` — ${scenario.healthNotes}` : ""}`,
    `Tobacco status: ${scenario.tobaccoUse ?? "not given"}${scenario.tobaccoNotes ? ` — ${scenario.tobaccoNotes}` : ""}`,
  ];
  if (lifeUnderwritingIntake) {
    if (lifeUnderwritingIntake.heightInches && lifeUnderwritingIntake.weightLbs) {
      clientProfileLines.push(
        `Build: ${lifeUnderwritingIntake.heightInches}in / ${lifeUnderwritingIntake.weightLbs}lbs`,
      );
    }
    clientProfileLines.push(
      `Major diagnoses (last 10 years): ${
        lifeUnderwritingIntake.majorDiagnoses.filter((d) => d !== "none").join(", ") || "None reported"
      }`,
      `Hospitalizations/surgeries (last 5 years): ${lifeUnderwritingIntake.hospitalizationsOrSurgeriesNotes || "None reported"}`,
      `Family history: ${lifeUnderwritingIntake.familyHistoryEarlyDeath ? "Parent/sibling death before 60" : "None reported"}`,
      `Occupation: ${lifeUnderwritingIntake.occupation || "not given"}`,
      `Hobbies: ${lifeUnderwritingIntake.hobbies || "None reported"}`,
      `DUI/moving violations: ${lifeUnderwritingIntake.duiHistory ?? "not given"}`,
      `Foreign travel planned: ${lifeUnderwritingIntake.foreignTravelNotes || "None reported"}`,
      `Existing life insurance in force: ${lifeUnderwritingIntake.existingLifeInsuranceNotes || "None reported"}`,
    );
  }
  if (underwritingEstimate) {
    clientProfileLines.push(
      `Likely underwriting class: ${underwritingEstimate.label} (${underwritingEstimate.confidence} confidence, subject to formal underwriting)`,
    );
  }

  const businessContextLines: string[] = [];
  if (scenario.businessOwnerStatus === "business_owner") {
    businessContextLines.push(
      `Business structure: ${scenario.businessStructure ?? "not given"}`,
      `Ownership: ${scenario.coOwnersNotes || "not given"}`,
      `Key employees: ${scenario.keyEmployeesCount ?? 0}${scenario.keyEmployeesNotes ? ` — ${scenario.keyEmployeesNotes}` : ""}`,
      `Annual revenue: ${scenario.incomeRevenueRange ?? "not given"}`,
    );
  }

  const scenarioSummaryLines = [
    `Client type: ${classification.activated.length > 0 ? classification.activated.map((a) => AVATAR_LABELS[a]).join(" + ") : "Not yet classified"}`,
    `Client goal: ${[...scenario.primaryGoals, scenario.goalsNotes].filter(Boolean).join("; ") || "not given"}`,
    `Existing relationship: ${scenario.existingRelationship ?? "not given"}`,
  ];

  const strategyRequestedLines = eligibleStrategies.map(
    (strategy, i) => `${i === 0 ? "Primary" : "Also paired with"}: ${strategy.name}`,
  );

  const coiNotes: string[] = [];
  if (eligibleStrategies.some((s) => TRUST_COI_SLUGS.has(s.slug))) {
    coiNotes.push(
      "This case needs an irrevocable trust — the agent will need an attorney to draft it and a separate trustee.",
    );
  }
  if (eligibleStrategies.some((s) => CPA_COI_SLUGS.has(s.slug))) {
    coiNotes.push(
      "This case needs a CPA sign-off on the compensation/deductibility treatment before implementation.",
    );
  }

  const complianceNote =
    "For internal illustration purposes only. Final strategy subject to underwriting, full case " +
    "review, and client decision. All benefit claims non-taxable while the policy remains in force.";

  // docs/06-wholesaler-handoff.md section 2's Agent Contact block also lists
  // phone, IMO/FMO/BGA affiliation, and licensed states — those live on
  // AgentProfile, not fetched here to keep this a pure function of the
  // Scenario + User already at hand. Name/email cover the essentials for now.
  const agentContactLines = [`${agent.name ?? agent.email}`, agent.email];

  return {
    clientProfileLines,
    businessContextLines,
    scenarioSummaryLines,
    strategyRequestedLines,
    coiNotes,
    complianceNote,
    agentContactLines,
  };
}
