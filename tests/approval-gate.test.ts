import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

// The approval gate (owner directive 2026-07-09): self-serve signups are
// applications. They sit in `pending` — no /app, /billing, or /onboarding —
// until an admin approves. Approval activates the account but does NOT grant
// a subscription (billing or an admin comp still comes after).

const { signUp, logIn } = await import("@/lib/auth");
const { approveUser, AdminActionError } = await import("@/lib/admin");

const createdUserIds: string[] = [];

function uniqueEmail(tag: string) {
  return `e2e-vitest-approval-${tag}-${Date.now()}@example.com`;
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.adminAction.deleteMany({
      where: { OR: [{ adminId: { in: createdUserIds } }, { targetUserId: { in: createdUserIds } }] },
    });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

async function createAdmin() {
  const admin = await prisma.user.create({
    data: {
      email: uniqueEmail("admin"),
      passwordHash: "unused",
      role: "admin",
      status: "active",
    },
  });
  createdUserIds.push(admin.id);
  return admin;
}

describe("approval gate", () => {
  it("self-serve signup lands in pending, not active", async () => {
    const user = await signUp(uniqueEmail("signup"), "supersecret123", "Pending Producer");
    createdUserIds.push(user.id);
    expect(user.status).toBe("pending");
  });

  it("a pending user can still log in (they land on the holding page, not the app)", async () => {
    const email = uniqueEmail("login");
    const user = await signUp(email, "supersecret123");
    createdUserIds.push(user.id);

    const loggedIn = await logIn(email, "supersecret123");
    expect(loggedIn.id).toBe(user.id);
    expect(loggedIn.status).toBe("pending");
  });

  it("approveUser activates the account, records the admin action, and audit-logs it", async () => {
    const admin = await createAdmin();
    const user = await signUp(uniqueEmail("approve"), "supersecret123", "Soon Approved");
    createdUserIds.push(user.id);

    await approveUser(admin, user.id, "http://localhost:3000");

    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    expect(refreshed?.status).toBe("active");

    const action = await prisma.adminAction.findFirst({
      where: { adminId: admin.id, targetUserId: user.id, action: "approve" },
    });
    expect(action).not.toBeNull();

    const audit = await prisma.auditLog.findFirst({
      where: { actorId: admin.id, action: "admin.user_approved", target: user.id },
    });
    expect(audit).not.toBeNull();

    // Approval does not hand out a subscription — billing still applies.
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription).toBeNull();
  });

  it("approveUser rejects non-pending targets and non-admin actors", async () => {
    const admin = await createAdmin();
    const user = await signUp(uniqueEmail("guards"), "supersecret123");
    createdUserIds.push(user.id);

    await approveUser(admin, user.id, "http://localhost:3000");
    // Second approval: no longer pending.
    await expect(approveUser(admin, user.id, "http://localhost:3000")).rejects.toThrow(
      AdminActionError,
    );

    const nonAdmin = await prisma.user.findUnique({ where: { id: user.id } });
    const victim = await signUp(uniqueEmail("victim"), "supersecret123");
    createdUserIds.push(victim.id);
    await expect(
      approveUser(nonAdmin!, victim.id, "http://localhost:3000"),
    ).rejects.toThrow(AdminActionError);
  });

  it("admin-created accounts (wholesalers etc.) still default to active", async () => {
    const wholesaler = await prisma.user.create({
      data: { email: uniqueEmail("wholesaler"), passwordHash: "unused", role: "wholesaler" },
    });
    createdUserIds.push(wholesaler.id);
    expect(wholesaler.status).toBe("active");
  });
});
