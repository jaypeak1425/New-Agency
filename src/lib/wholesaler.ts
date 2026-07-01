import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetToken } from "@/lib/auth";
import { sendWholesalerInviteEmail } from "@/lib/email";
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
