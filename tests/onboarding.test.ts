import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { needsOnboarding, completeOnboarding, skipOnboarding } from "@/lib/onboarding";

const createdUserIds: string[] = [];

async function makeUser(email: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "unused" } });
  createdUserIds.push(user.id);
  return user;
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.agentProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe("onboarding", () => {
  it("admins never need onboarding", async () => {
    const user = await makeUser(`e2e-vitest-onboarding-admin-${Date.now()}@example.com`);
    expect(await needsOnboarding(user.id, "admin")).toBe(false);
  });

  it("a new user needs onboarding until they complete or skip it", async () => {
    const user = await makeUser(`e2e-vitest-onboarding-new-${Date.now()}@example.com`);
    expect(await needsOnboarding(user.id, "user")).toBe(true);
  });

  it("completing onboarding persists the profile and clears the need for it", async () => {
    const user = await makeUser(`e2e-vitest-onboarding-complete-${Date.now()}@example.com`);

    await completeOnboarding(user.id, {
      tenureBand: "yr_3_5",
      currentIncomeBand: "band_100k_250k",
      goalIncome: 500000,
      avatarMix: ["business_owner", "high_net_worth"],
      interactionPreference: "type",
      outputPreference: "pdf",
      reminderFrequency: "weekly",
      hasCpaRelationship: true,
      hasAttorneyRelationship: false,
      imoAffiliation: "Test IMO",
    });

    expect(await needsOnboarding(user.id, "user")).toBe(false);

    const profile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
    expect(profile).toMatchObject({
      tenureBand: "yr_3_5",
      goalIncome: 500000,
      avatarMix: ["business_owner", "high_net_worth"],
      hasCpaRelationship: true,
      skipped: false,
    });
    expect(profile?.completedAt).not.toBeNull();

    const auditRow = await prisma.auditLog.findFirst({
      where: { actorId: user.id, action: "onboarding.completed" },
    });
    expect(auditRow).not.toBeNull();
  });

  it("skipping onboarding marks it skipped but still clears the need for it", async () => {
    const user = await makeUser(`e2e-vitest-onboarding-skip-${Date.now()}@example.com`);

    await skipOnboarding(user.id);

    expect(await needsOnboarding(user.id, "user")).toBe(false);

    const profile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
    expect(profile?.skipped).toBe(true);
    expect(profile?.completedAt).not.toBeNull();

    const auditRow = await prisma.auditLog.findFirst({
      where: { actorId: user.id, action: "onboarding.skipped" },
    });
    expect(auditRow).not.toBeNull();
  });
});
