import { prisma } from "@/lib/prisma";
import { sendAccountApprovedEmail } from "@/lib/email";
import type { User } from "@/generated/prisma/client";

export class AdminActionError extends Error {}

function assertAdmin(actor: User) {
  if (actor.role !== "admin") {
    throw new AdminActionError("Only admins can perform this action.");
  }
}

async function recordAdminAction(
  admin: User,
  targetUserId: string,
  action: "approve" | "grant" | "revoke" | "suspend" | "reactivate",
  auditAction: string,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  await prisma.$transaction([
    prisma.adminAction.create({
      data: { adminId: admin.id, targetUserId, action },
    }),
    prisma.auditLog.create({
      data: { actorId: admin.id, action: auditAction, target: targetUserId, metadata },
    }),
  ]);
}

// The approval gate: self-serve signups sit in `pending` (no /app or /billing
// access) until an admin signs off. Approval activates the account and emails
// the agent — it does NOT grant a subscription; they still pay (or get comped
// via grantAccess for PeakBritt-contracted producers).
export async function approveUser(admin: User, targetUserId: string, appBaseUrl: string) {
  assertAdmin(admin);

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new AdminActionError("User not found.");
  }
  if (target.status !== "pending") {
    throw new AdminActionError("Only pending accounts can be approved.");
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { status: "active" } });
  await recordAdminAction(admin, targetUserId, "approve", "admin.user_approved", {
    email: target.email,
  });
  await sendAccountApprovedEmail(target.email, target.name, appBaseUrl);
}

export async function suspendUser(admin: User, targetUserId: string) {
  assertAdmin(admin);
  if (admin.id === targetUserId) {
    throw new AdminActionError("Admins can't suspend their own account.");
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { status: "suspended" } });
  await recordAdminAction(admin, targetUserId, "suspend", "admin.user_suspended");
}

export async function reactivateUser(admin: User, targetUserId: string) {
  assertAdmin(admin);

  await prisma.user.update({ where: { id: targetUserId }, data: { status: "active" } });
  await recordAdminAction(admin, targetUserId, "reactivate", "admin.user_reactivated");
}

// Comps a user's access without a real Stripe customer/subscription — for
// design partners and beta testers per the business plan (docs/20-business-plan.md).
export async function grantAccess(admin: User, targetUserId: string) {
  assertAdmin(admin);

  await prisma.subscription.upsert({
    where: { userId: targetUserId },
    create: { userId: targetUserId, status: "active", plan: "comped" },
    update: { status: "active" },
  });
  await recordAdminAction(admin, targetUserId, "grant", "admin.access_granted");
}

export async function revokeAccess(admin: User, targetUserId: string) {
  assertAdmin(admin);

  await prisma.subscription.updateMany({
    where: { userId: targetUserId },
    data: { status: "canceled" },
  });
  await recordAdminAction(admin, targetUserId, "revoke", "admin.access_revoked");
}

export async function listUsersForAdmin() {
  return prisma.user.findMany({
    include: { subscription: true, assignedWholesaler: true },
    orderBy: { createdAt: "desc" },
  });
}
