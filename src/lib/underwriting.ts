import { prisma } from "@/lib/prisma";
import { getScenarioForUser } from "@/lib/scenarios";
import type {
  DuiHistory,
  EstatePlanningIntent,
  IncomeRevenueRange,
  IncomeStartTiming,
  LifeUnderwritingIntake,
  MajorDiagnosis,
  Scenario,
  SourceOfFunds,
  TaxBracket,
} from "@/generated/prisma/client";

// docs/04-field-underwriting.md section 2 — age (Q1) and tobacco (Q3) reuse
// the identical questions already collected by the 10-question intake
// (Session 4). Medications (Q4) aren't parsed from free text (needs the AI
// backend, not wired up) — majorDiagnoses captures the underwriting-relevant
// condition signal directly instead of trying to map drug names to
// conditions.
export interface LifeUnderwritingAnswers {
  heightInches: number | null;
  weightLbs: number | null;
  majorDiagnoses: MajorDiagnosis[];
  hospitalizationsOrSurgeriesNotes: string | null;
  familyHistoryEarlyDeath: boolean | null;
  occupation: string | null;
  hazardousOccupation: boolean | null;
  hobbies: string | null;
  hazardousHobby: boolean | null;
  duiHistory: DuiHistory | null;
  foreignTravelPlanned: boolean | null;
  foreignTravelNotes: string | null;
  existingLifeInsuranceNotes: string | null;
}

export async function getLifeUnderwritingIntake(userId: string, scenarioId: string) {
  await getScenarioForUser(userId, scenarioId);
  return prisma.lifeUnderwritingIntake.findUnique({ where: { scenarioId } });
}

export async function saveLifeUnderwritingIntake(
  userId: string,
  scenarioId: string,
  answers: LifeUnderwritingAnswers,
) {
  await getScenarioForUser(userId, scenarioId);

  const intake = await prisma.lifeUnderwritingIntake.upsert({
    where: { scenarioId },
    create: { scenarioId, ...answers, completedAt: new Date() },
    update: { ...answers, completedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.life_underwriting_completed",
      target: scenarioId,
      metadata: {},
    },
  });

  return intake;
}

// docs/04-field-underwriting.md section 4 — Q4 (age) reuses Scenario.primaryAge.
export interface AnnuityIntakeAnswers {
  liquidNetWorthRange: IncomeRevenueRange | null;
  sourceOfFunds: SourceOfFunds | null;
  allocationAmount: number | null;
  desiredIncomeStartDate: IncomeStartTiming | null;
  existingAnnuityContractsNotes: string | null;
  taxBracket: TaxBracket | null;
  estatePlanningIntent: EstatePlanningIntent | null;
  needsLiquidityWithin5to7Years: boolean | null;
}

export async function getAnnuityIntake(userId: string, scenarioId: string) {
  await getScenarioForUser(userId, scenarioId);
  return prisma.annuityIntake.findUnique({ where: { scenarioId } });
}

export async function saveAnnuityIntake(
  userId: string,
  scenarioId: string,
  answers: AnnuityIntakeAnswers,
) {
  await getScenarioForUser(userId, scenarioId);

  const intake = await prisma.annuityIntake.upsert({
    where: { scenarioId },
    create: { scenarioId, ...answers, completedAt: new Date() },
    update: { ...answers, completedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.annuity_intake_completed",
      target: scenarioId,
      metadata: {},
    },
  });

  return intake;
}

export type UnderwritingClass =
  | "preferred_plus"
  | "preferred"
  | "standard_plus_or_standard"
  | "standard_to_table_2"
  | "table_2_4"
  | "table_4_8_or_postpone";

const CLASS_LABELS: Record<UnderwritingClass, string> = {
  preferred_plus: "Preferred Plus",
  preferred: "Preferred",
  standard_plus_or_standard: "Standard Plus or Standard",
  standard_to_table_2: "Standard to Table 2",
  table_2_4: "Table 2-4",
  table_4_8_or_postpone: "Table 4-8 or post-pone",
};

// Tiers map directly to docs/04-field-underwriting.md section 3's table rows
// (0 = the top row, 5 = the bottom row). "Worst applicable factor wins" is a
// simplification of real underwriting (which weighs combinations more
// subtly) — flagged here rather than presented as a precise class.
const TIER_TO_CLASS: UnderwritingClass[] = [
  "preferred_plus",
  "preferred",
  "standard_plus_or_standard",
  "standard_to_table_2",
  "table_2_4",
  "table_4_8_or_postpone",
];

const DIAGNOSIS_TIER: Record<MajorDiagnosis, number> = {
  none: 0,
  mental_health_hospitalization: 1,
  diabetes_type_2_controlled: 3,
  diabetes_type_1: 4,
  autoimmune: 4,
  heart_attack_or_stroke: 5,
  cancer: 5,
};

export interface UnderwritingEstimate {
  class: UnderwritingClass;
  label: string;
  confidence: "high" | "medium";
  rationale: string[];
}

export function estimateUnderwritingClass(
  scenario: Scenario,
  intake: LifeUnderwritingIntake | null,
): UnderwritingEstimate | null {
  if (!intake) return null;

  let tier = 0;
  const rationale: string[] = [];

  if (scenario.primaryAge !== null) {
    if (scenario.primaryAge > 80) {
      tier = Math.max(tier, 5);
      rationale.push(`age ${scenario.primaryAge} is well outside the typical underwriting window`);
    } else if (scenario.primaryAge < 40 || scenario.primaryAge > 65) {
      tier = Math.max(tier, 1);
      rationale.push(`age ${scenario.primaryAge} is outside the 40-65 Preferred Plus sweet spot`);
    }
  }

  if (intake.heightInches !== null && intake.weightLbs !== null && intake.heightInches > 0) {
    const bmi = (intake.weightLbs / (intake.heightInches * intake.heightInches)) * 703;
    if (bmi < 18.5 || bmi > 27) {
      tier = Math.max(tier, 2);
      rationale.push("build is outside the standard range for most carriers");
    }
  }

  if (scenario.tobaccoUse === "occasional") {
    tier = Math.max(tier, 1);
    rationale.push("occasional tobacco use typically disqualifies Preferred Plus");
  } else if (scenario.tobaccoUse === "regular") {
    tier = Math.max(tier, 2);
    rationale.push("regular tobacco use pushes to tobacco rates");
  }

  const diagnosisTier = Math.max(
    0,
    ...intake.majorDiagnoses.filter((d) => d !== "none").map((d) => DIAGNOSIS_TIER[d]),
  );
  if (diagnosisTier > 0) {
    tier = Math.max(tier, diagnosisTier);
    rationale.push("major diagnosis history affects the rating");
  }

  if (intake.familyHistoryEarlyDeath === true) {
    tier = Math.max(tier, 1);
    rationale.push("family history of early cardiac/cancer death is a Preferred Plus disqualifier");
  }

  if (intake.hazardousOccupation === true || intake.hazardousHobby === true) {
    tier = Math.max(tier, 2);
    rationale.push("a hazardous occupation or hobby typically adds a rating");
  }

  if (intake.duiHistory === "single_5_plus_years_ago") {
    tier = Math.max(tier, 1);
    rationale.push("a single DUI 5+ years ago is often Standard at worst");
  } else if (intake.duiHistory === "within_3_years") {
    tier = Math.max(tier, 2);
    rationale.push("a DUI within the last 3 years typically adds a rating");
  } else if (intake.duiHistory === "multiple") {
    tier = Math.max(tier, 4);
    rationale.push("multiple DUIs often lead to a post-pone or decline");
  }

  const clampedTier = Math.min(tier, TIER_TO_CLASS.length - 1);
  const underwritingClass = TIER_TO_CLASS[clampedTier];
  const confidence: "high" | "medium" = clampedTier === 0 || clampedTier >= 5 ? "high" : "medium";

  return {
    class: underwritingClass,
    label: CLASS_LABELS[underwritingClass],
    confidence,
    rationale,
  };
}
