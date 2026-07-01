import { prisma } from "@/lib/prisma";
import type {
  BeneficiaryStructure,
  BusinessOwnerStatus,
  BusinessStructure,
  ControlPreference,
  ExistingRelationship,
  ExistingStructure,
  FundingPreference,
  HealthRating,
  IncomeRevenueRange,
  IntakeGoal,
  MaritalStatus,
  NetWorthEstimate,
  QualifiedFundsEstimate,
  TobaccoUse,
  UrgencyDriver,
} from "@/generated/prisma/client";

export class ScenarioError extends Error {}

// docs/23-wholesaler-assignment.md section 2: until the real 10-question
// intake and eligibility gates exist, a case is just a label + free-text
// notes, created directly by the agent.
export async function createScenario(userId: string, label: string, notes: string | undefined) {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    throw new ScenarioError("A case label is required.");
  }

  const scenario = await prisma.scenario.create({
    data: { userId, label: trimmedLabel, notes: notes?.trim() || null },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.created",
      target: scenario.id,
      metadata: { label: trimmedLabel },
    },
  });

  return scenario;
}

export async function listScenariosForUser(userId: string) {
  return prisma.scenario.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getScenarioForUser(userId: string, scenarioId: string) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario || scenario.userId !== userId) {
    throw new ScenarioError("Case not found.");
  }
  return scenario;
}

// docs/03-intake-flow.md section 2 — the 10-question "I've got a guy" intake,
// captured as structured form fields (see the schema comment on Scenario for
// why this isn't free-text NLP parsing yet).
export interface IntakeAnswers {
  clientDescription: string | null;
  primaryAge: number | null;
  healthRating: HealthRating | null;
  healthNotes: string | null;
  tobaccoUse: TobaccoUse | null;
  tobaccoNotes: string | null;
  businessOwnerStatus: BusinessOwnerStatus | null;
  businessStructure: BusinessStructure | null;
  coOwnersNotes: string | null;
  keyEmployeesCount: number | null;
  keyEmployeesNotes: string | null;
  primaryGoals: IntakeGoal[];
  goalsNotes: string | null;
  existingRelationship: ExistingRelationship | null;
  incomeRevenueRange: IncomeRevenueRange | null;
  netWorthEstimate: NetWorthEstimate | null;
  qualifiedFundsEstimate: QualifiedFundsEstimate | null;
  hasDependentsUnder18: boolean | null;
  maritalStatus: MaritalStatus | null;
  stateOfResidence: string | null;
  illiquidNetWorth: boolean | null;
  estateExceedsExemption: boolean | null;
  concentratedLowBasisPosition: boolean | null;
  beneficiaryStructure: BeneficiaryStructure | null;
  controlPreference: ControlPreference | null;
  fundingPreference: FundingPreference | null;
  existingStructures: ExistingStructure[];
  urgencyDriver: UrgencyDriver | null;
  existingPolicyTransfer: boolean | null;
}

export async function saveIntakeAnswers(
  userId: string,
  scenarioId: string,
  answers: IntakeAnswers,
) {
  await getScenarioForUser(userId, scenarioId);

  const scenario = await prisma.scenario.update({
    where: { id: scenarioId },
    data: { ...answers, intakeCompletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.intake_completed",
      target: scenarioId,
      metadata: {},
    },
  });

  return scenario;
}
