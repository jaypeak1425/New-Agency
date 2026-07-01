import { prisma } from "@/lib/prisma";

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
