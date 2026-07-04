import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetToken } from "@/lib/auth";
import { sendWholesalerInviteEmail, sendWholesalerCaseNotificationEmail } from "@/lib/email";
import { classifyAvatars } from "@/lib/avatars";
import { recommendStrategies } from "@/lib/recommendations";
import { getLifeUnderwritingIntake, estimateUnderwritingClass } from "@/lib/underwriting";
import { buildHandoffContent } from "@/lib/handoff";
import type { User } from "@/generated/prisma/client";

export class WholesalerActionError extends Error {}

function assertAdmin(actor: User) {
  if (actor.role !== "admin") {
    throw new WholesalerActionError("Only admins can perform this action.");
  }
}

// docs/23-wholesaler-assignment.md section 1: admin creates the account,
// there's no self-serve wholesaler signup. The account gets an unusable
// random password until the invite's password-reset-as-invite link is used.
export async function createWholesalerAccount(
  admin: User,
  email: string,
  name: string | undefined,
  appBaseUrl: string,
) {
  assertAdmin(admin);

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new WholesalerActionError("Email is required.");
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new WholesalerActionError("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const wholesaler = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      role: "wholesaler",
    },
  });

  await prisma.$transaction([
    prisma.adminAction.create({
      data: { adminId: admin.id, targetUserId: wholesaler.id, action: "create_wholesaler" },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "admin.wholesaler_created",
        target: wholesaler.id,
        metadata: { email: normalizedEmail },
      },
    }),
  ]);

  const rawToken = await issuePasswordResetToken(wholesaler.id);
  const setupUrl = `${appBaseUrl}/reset-password/${rawToken}`;
  await sendWholesalerInviteEmail(wholesaler.email, wholesaler.name, setupUrl);

  return wholesaler;
}

export async function assignWholesaler(admin: User, agentUserId: string, wholesalerUserId: string) {
  assertAdmin(admin);

  const [agent, wholesaler] = await Promise.all([
    prisma.user.findUnique({ where: { id: agentUserId } }),
    prisma.user.findUnique({ where: { id: wholesalerUserId } }),
  ]);

  if (!agent || agent.role !== "user") {
    throw new WholesalerActionError("Agent not found.");
  }
  if (!wholesaler || wholesaler.role !== "wholesaler") {
    throw new WholesalerActionError("Wholesaler not found.");
  }

  await prisma.user.update({
    where: { id: agentUserId },
    data: { assignedWholesalerId: wholesalerUserId },
  });

  await prisma.$transaction([
    prisma.adminAction.create({
      data: { adminId: admin.id, targetUserId: agentUserId, action: "assign_wholesaler" },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "admin.wholesaler_assigned",
        target: agentUserId,
        metadata: { wholesalerUserId },
      },
    }),
  ]);
}

export async function unassignWholesaler(admin: User, agentUserId: string) {
  assertAdmin(admin);

  const agent = await prisma.user.findUnique({ where: { id: agentUserId } });
  if (!agent || agent.role !== "user") {
    throw new WholesalerActionError("Agent not found.");
  }

  await prisma.user.update({
    where: { id: agentUserId },
    data: { assignedWholesalerId: null },
  });

  await prisma.$transaction([
    prisma.adminAction.create({
      data: { adminId: admin.id, targetUserId: agentUserId, action: "unassign_wholesaler" },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "admin.wholesaler_unassigned",
        target: agentUserId,
        metadata: {},
      },
    }),
  ]);
}

export async function listWholesalersForAdmin() {
  return prisma.user.findMany({
    where: { role: "wholesaler" },
    orderBy: { createdAt: "desc" },
  });
}

// docs/23-wholesaler-assignment.md section 3: the portal is scoped to the
// wholesaler's assigned agents and is read-only.
export async function listCasesForWholesaler(wholesalerUserId: string) {
  return prisma.user.findMany({
    where: { role: "user", assignedWholesalerId: wholesalerUserId },
    include: { scenarios: { orderBy: { createdAt: "desc" } } },
    orderBy: { name: "asc" },
  });
}

// docs/06-wholesaler-handoff.md section 1: "Atlas triggers a wholesaler
// handoff when all five eligibility gates pass." Builds the real
// illustration-request content (client profile, business context, strategy
// requested, COI note) from the recommendation engine — this is what
// replaces docs/23-wholesaler-assignment.md's bridge "Notify my wholesaler"
// button now that the real eligibility-gate/recommendation engine exists.
// Still requires the agent to click send (docs/06 section 9: "Atlas never
// auto-sends without the agent's approval") — this function IS that send.
export async function buildHandoffPreview(agent: User, scenarioId: string) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario || scenario.userId !== agent.id) {
    throw new WholesalerActionError("Case not found.");
  }

  const lifeUnderwritingIntake = await getLifeUnderwritingIntake(agent.id, scenarioId);
  const { pivot, recommendations } = await recommendStrategies(scenario, lifeUnderwritingIntake);
  const eligible = recommendations.filter((r) => r.eligibility === "eligible").map((r) => r.strategy);
  const classification = classifyAvatars(scenario);
  const underwritingEstimate = estimateUnderwritingClass(scenario, lifeUnderwritingIntake);

  // A pivot no longer blocks the handoff outright: if a documented
  // annuity-side strategy (Annuity Rescue / Qualified LTC) is fully eligible,
  // that IS the strategy request the wholesaler receives.
  if (pivot.triggered && eligible.length === 0) {
    return { ready: false as const, reason: pivot.message ?? "This case needs a pivot to an alternative strategy first.", content: null };
  }
  if (eligible.length === 0) {
    return {
      ready: false as const,
      reason: "No strategy is fully eligible yet — complete more of the intake before notifying your wholesaler.",
      content: null,
    };
  }

  const content = buildHandoffContent(
    scenario,
    classification,
    eligible,
    lifeUnderwritingIntake,
    underwritingEstimate,
    agent,
  );
  return { ready: true as const, reason: null, content };
}

export async function notifyWholesalerForScenario(
  agent: User,
  scenarioId: string,
  appBaseUrl: string,
) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario || scenario.userId !== agent.id) {
    throw new WholesalerActionError("Case not found.");
  }

  if (!agent.assignedWholesalerId) {
    throw new WholesalerActionError(
      "No wholesaler is assigned to your account. Ask an admin to assign one.",
    );
  }

  const wholesaler = await prisma.user.findUnique({ where: { id: agent.assignedWholesalerId } });
  if (!wholesaler) {
    throw new WholesalerActionError(
      "No wholesaler is assigned to your account. Ask an admin to assign one.",
    );
  }

  const preview = await buildHandoffPreview(agent, scenarioId);
  if (!preview.ready) {
    throw new WholesalerActionError(preview.reason);
  }

  await prisma.$transaction([
    prisma.scenario.update({ where: { id: scenarioId }, data: { wholesalerNotifiedAt: new Date() } }),
    prisma.auditLog.create({
      data: {
        actorId: agent.id,
        action: "wholesaler.notified",
        target: scenarioId,
        metadata: {
          wholesalerUserId: wholesaler.id,
          strategyRequested: preview.content.strategyRequestedLines,
        },
      },
    }),
  ]);

  await sendWholesalerCaseNotificationEmail(wholesaler.email, {
    wholesalerName: wholesaler.name,
    agentName: agent.name ?? agent.email,
    caseLabel: scenario.label,
    portalUrl: `${appBaseUrl}/wholesaler`,
    handoffContent: preview.content,
  });
}
