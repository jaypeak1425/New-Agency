import { describe, it, expect, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  enrollInSequence,
  processDueSequenceSends,
  unsubscribeFromSequence,
  SequenceError,
} from "@/lib/sequence";
import { SEQUENCE_LENGTH } from "@/lib/emails/sequence-content";
import type { User } from "@/generated/prisma/client";

const createdUserIds: string[] = [];
const createdEnrollmentEmails: string[] = [];

afterAll(async () => {
  await prisma.sequenceEnrollment.deleteMany({ where: { email: { in: createdEnrollmentEmails } } });
  if (createdUserIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

async function createTestAdmin(): Promise<User> {
  const admin = await prisma.user.create({
    data: {
      email: `seq-admin-${Date.now()}@example.com`,
      passwordHash: "unused",
      role: "admin",
    },
  });
  createdUserIds.push(admin.id);
  return admin;
}

describe("email sequence (docs/15)", () => {
  it("rejects invalid addresses and is a silent no-op on re-enrollment", async () => {
    await expect(enrollInSequence("not-an-email")).rejects.toThrow(SequenceError);

    const email = `seq-prospect-${Date.now()}@example.com`;
    createdEnrollmentEmails.push(email);
    const first = await enrollInSequence(email);
    const second = await enrollInSequence(email.toUpperCase());
    expect(second.id).toBe(first.id);
    expect(second.nextStep).toBe(1);
  });

  it("walks an enrollment through all 7 steps and completes it", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const admin = await createTestAdmin();
    const email = `seq-walk-${Date.now()}@example.com`;
    createdEnrollmentEmails.push(email);
    const enrollment = await enrollInSequence(email);

    for (let step = 1; step <= SEQUENCE_LENGTH; step++) {
      // Email 1 is due immediately; pull later steps' nextSendAt back so
      // the pass picks them up without waiting out the 3-day cadence.
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { nextSendAt: new Date(Date.now() - 1000) },
      });
      const { sent } = await processDueSequenceSends(admin);
      expect(sent).toBeGreaterThanOrEqual(1);
    }

    const done = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollment.id } });
    expect(done?.completedAt).not.toBeNull();

    // A further pass leaves a completed enrollment untouched. (Other due
    // enrollments may legitimately exist in the shared dev DB, so assert on
    // this enrollment's state rather than the global sent count.)
    await processDueSequenceSends(admin);
    const stillDone = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollment.id } });
    expect(stillDone?.nextStep).toBe(SEQUENCE_LENGTH);
    expect(stillDone?.completedAt).toEqual(done?.completedAt);
    vi.restoreAllMocks();
  });

  it("never sends to an unsubscribed enrollment", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const admin = await createTestAdmin();
    const email = `seq-unsub-${Date.now()}@example.com`;
    createdEnrollmentEmails.push(email);
    const enrollment = await enrollInSequence(email);
    await unsubscribeFromSequence(enrollment.id);

    await processDueSequenceSends(admin);
    const row = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollment.id } });
    expect(row?.nextStep).toBe(1);
    expect(row?.unsubscribedAt).not.toBeNull();
    vi.restoreAllMocks();
  });
});
