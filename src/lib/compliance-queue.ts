import { prisma } from "@/lib/prisma";
import { buildHandoffPreview } from "@/lib/wholesaler";
import type { User, ComplianceFlagStatus } from "@/generated/prisma/client";

export class ComplianceQueueError extends Error {}

function assertAdmin(actor: User) {
  if (actor.role !== "admin") {
    throw new ComplianceQueueError("Only admins can manage the compliance queue.");
  }
}

function flattenHandoffContent(content: Awaited<ReturnType<typeof buildHandoffPreview>>["content"]) {
  if (!content) return "";
  return [
    "Client profile:",
    ...content.clientProfileLines,
    "",
    "Business context:",
    ...content.businessContextLines,
    "",
    "Scenario summary:",
    ...content.scenarioSummaryLines,
    "",
    "Strategy requested:",
    ...content.strategyRequestedLines,
    "",
    "COI notes:",
    ...content.coiNotes,
    "",
    content.complianceNote,
  ].join("\n");
}

// docs/08-master-dashboard.md section 4, Trigger 3: "Every 90 days, the
// compliance officer runs a random audit of 5% of generated outputs." No
// cron/job runner exists in this repo (same limitation as the weekly call
// queue), so this is admin-triggered rather than scheduled. The wholesaler
// handoff email is the one real "generated output" this app produces —
// sampling already-sent handoffs, not fabricated client-facing copy.
export async function runPeriodicAudit(admin: User) {
  assertAdmin(admin);

  const alreadyFlaggedScenarioIds = (
    await prisma.complianceFlag.findMany({
      where: { triggerType: "periodic_audit", scenarioId: { not: null } },
      select: { scenarioId: true },
    })
  ).map((f) => f.scenarioId);

  const candidates = await prisma.scenario.findMany({
    where: {
      wholesalerNotifiedAt: { not: null },
      id: { notIn: alreadyFlaggedScenarioIds as string[] },
    },
  });

  const sampleSize = Math.max(1, Math.ceil(candidates.length * 0.05));
  const sample = [...candidates].sort(() => Math.random() - 0.5).slice(0, sampleSize);

  const created = [];
  for (const scenario of sample) {
    const agent = await prisma.user.findUnique({ where: { id: scenario.userId } });
    if (!agent) continue;

    const preview = await buildHandoffPreview(agent, scenario.id);
    const content = preview.ready
      ? flattenHandoffContent(preview.content)
      : "(handoff content unavailable — case changed since it was sent)";

    const flag = await prisma.complianceFlag.create({
      data: { triggerType: "periodic_audit", content, scenarioId: scenario.id },
    });
    created.push(flag);
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "compliance.periodic_audit_run",
      target: admin.id,
      metadata: { candidateCount: candidates.length, sampledCount: created.length },
    },
  });

  return created;
}

// docs/08-master-dashboard.md section 4, Trigger 2: "Before a new strategy
// goes live in the brain, it must pass compliance review." Clearing this
// flag records the compliance sign-off — it does NOT flip the strategy's
// `pending_content` status to `documented`, since that requires the real
// mechanics/legal-basis content the Brain Lock rule (CLAUDE.md) requires,
// which is a separate content-authoring step, not a compliance review step.
export async function flagStrategyForPreLaunchReview(admin: User, strategyId: string) {
  assertAdmin(admin);

  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy) {
    throw new ComplianceQueueError("Strategy not found.");
  }

  const flag = await prisma.complianceFlag.create({
    data: {
      triggerType: "pre_launch",
      content: `Strategy card: ${strategy.name} (${strategy.tier})\n\n${
        strategy.clientTriggerProfile ?? "No client trigger profile yet."
      }\n\n${strategy.mechanics ?? "No mechanics documented yet."}`,
      strategyId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "compliance.pre_launch_flag_created",
      target: strategyId,
      metadata: { strategyName: strategy.name },
    },
  });

  return flag;
}

export async function getComplianceQueue() {
  return prisma.complianceFlag.findMany({
    where: { status: "open" },
    include: { scenario: true, strategy: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getResolvedComplianceFlags() {
  return prisma.complianceFlag.findMany({
    where: { status: { not: "open" } },
    include: { scenario: true, strategy: true, resolver: true },
    orderBy: { resolvedAt: "desc" },
    take: 50,
  });
}

const RESOLUTION_STATUSES: ComplianceFlagStatus[] = ["cleared", "rejected", "escalated"];

// docs/08-master-dashboard.md section 4's Queue UI: "Clear (output is
// released) / Rephrase (output is rewritten) / Reject (output is not
// released) / Escalate (sent to a senior reviewer)." No output-release
// pipeline exists to act on for filter_caught/pre_launch flags (see the
// model comment), so "Clear" here just records the sign-off; "Rephrase" is
// folded into resolutionNotes rather than a separate status, since there's
// no live output to actually rewrite and re-deliver.
export async function resolveComplianceFlag(
  admin: User,
  flagId: string,
  resolution: ComplianceFlagStatus,
  resolutionNotes: string | null,
) {
  assertAdmin(admin);
  if (!RESOLUTION_STATUSES.includes(resolution)) {
    throw new ComplianceQueueError("Invalid resolution.");
  }

  const flag = await prisma.complianceFlag.update({
    where: { id: flagId },
    data: { status: resolution, resolverId: admin.id, resolutionNotes, resolvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "compliance.flag_resolved",
      target: flagId,
      metadata: { resolution, resolutionNotes },
    },
  });

  return flag;
}
