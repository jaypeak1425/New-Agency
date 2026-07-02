import { prisma } from "@/lib/prisma";
import type { Strategy, User } from "@/generated/prisma/client";

export class StrategyError extends Error {}

// Brain Lock (CLAUDE.md): the recommendation engine may only ever surface
// `documented` strategies to an agent. `pending_content` rows exist purely
// as a roster placeholder until the real brain doc content is supplied.
export async function listDocumentedStrategies() {
  return prisma.strategy.findMany({
    where: { status: "documented" },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });
}

export async function listAllStrategiesForAdmin() {
  return prisma.strategy.findMany({
    include: { complianceFlags: { where: { status: "open" } } },
    orderBy: [{ tier: "asc" }, { status: "asc" }, { name: "asc" }],
  });
}

// docs/09-prelaunch-validation.md Gate 1: a strategy card can't go live
// unless every section of the card actually exists. This is what keeps
// "Approve & go live" from flipping an empty placeholder to documented.
export function missingCardFields(strategy: Strategy): string[] {
  const missing: string[] = [];
  if (!strategy.clientTriggerProfile?.trim()) missing.push("client trigger profile");
  if (!strategy.legalBasis?.trim()) missing.push("legal basis");
  if (!strategy.mechanics?.trim()) missing.push("mechanics");
  if (!strategy.whyUsed?.trim()) missing.push("why used");
  if (!Array.isArray(strategy.matchingParameters) || strategy.matchingParameters.length === 0) {
    missing.push("matching parameters");
  }
  if (strategy.uplineQuestions.length === 0) missing.push("upline questions");
  return missing;
}

// docs/09-prelaunch-validation.md Path A: the single-reviewer sign-off that
// takes a fully drafted pending_content card live. Flipping status to
// `documented` is exactly what admits the strategy into the Brain-Locked
// recommendation engine, so this is the one place that transition happens —
// gated on card completeness (Gate 1), restricted to admins, audit-logged
// with a content snapshot, and clearing any open pre-launch compliance flag
// as part of the same transaction (the approval IS the review resolution).
export async function approveStrategyForLaunch(admin: User, strategyId: string) {
  if (admin.role !== "admin") {
    throw new StrategyError("Only an admin can approve a strategy for launch.");
  }

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: { complianceFlags: { where: { status: "open", triggerType: "pre_launch" } } },
  });
  if (!strategy) throw new StrategyError("Strategy not found.");
  if (strategy.status === "documented") {
    throw new StrategyError(`"${strategy.name}" is already live.`);
  }

  const missing = missingCardFields(strategy);
  if (missing.length > 0) {
    throw new StrategyError(
      `"${strategy.name}" can't go live — the card is missing: ${missing.join(", ")}.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.strategy.update({ where: { id: strategy.id }, data: { status: "documented" } });
    for (const flag of strategy.complianceFlags) {
      await tx.complianceFlag.update({
        where: { id: flag.id },
        data: {
          status: "cleared",
          resolverId: admin.id,
          resolutionNotes: "Cleared by the Approve & go live sign-off (docs/09 Path A).",
          resolvedAt: new Date(),
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "strategy.approved_live",
        target: strategy.id,
        metadata: {
          slug: strategy.slug,
          name: strategy.name,
          clearedPreLaunchFlags: strategy.complianceFlags.map((f) => f.id),
          cardSnapshot: {
            clientTriggerProfile: strategy.clientTriggerProfile,
            legalBasis: strategy.legalBasis,
            mechanics: strategy.mechanics,
            whyUsed: strategy.whyUsed,
            matchingParameters: strategy.matchingParameters,
            uplineQuestions: strategy.uplineQuestions,
            sourceDoc: strategy.sourceDoc,
            notes: strategy.notes,
          },
        },
      },
    });
  });
}
