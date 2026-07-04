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
  RelationshipType,
  ScenarioStatus,
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

// docs/07-progress-dashboard-math.md section 5, edge cases 4/5: closed_won
// and closed_lost stamp `closedAt` so the dashboard's "Closed This Year"
// widget can filter to this year's closes; every other transition clears it.
export async function updateScenarioStatus(userId: string, scenarioId: string, status: ScenarioStatus) {
  await getScenarioForUser(userId, scenarioId);

  const closedAt = status === "closed_won" || status === "closed_lost" ? new Date() : null;
  const scenario = await prisma.scenario.update({
    where: { id: scenarioId },
    data: { status, closedAt },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.status_updated",
      target: scenarioId,
      metadata: { status },
    },
  });

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
  relationshipType: RelationshipType | null;
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
  // Agent-only case numbers for the quantified improvement analysis.
  estimatedEstateValue: number | null;
  estimatedQualifiedBalance: number | null;
  estimatedTaxableIncome: number | null;
}

// The free-text "I've got a guy" parser's output: saves whatever Atlas
// extracted onto the scenario WITHOUT stamping intakeCompletedAt — the agent
// reviews the pre-filled form, answers what the parser couldn't extract, and
// completes the intake themselves. Auditability (CLAUDE.md): which fields
// came from parsing is logged, so a recommendation can always be traced back
// to whether its inputs were typed or extracted.
export async function saveParsedIntakeDraft(
  userId: string,
  scenarioId: string,
  answers: Partial<IntakeAnswers>,
  extractedFields: string[],
) {
  await getScenarioForUser(userId, scenarioId);

  const scenario = await prisma.scenario.update({
    where: { id: scenarioId },
    data: answers,
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "scenario.intake_parsed",
      target: scenarioId,
      metadata: { extractedFields },
    },
  });

  return scenario;
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
