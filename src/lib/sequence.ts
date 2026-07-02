import { prisma } from "@/lib/prisma";
import { emailShell } from "@/lib/emails/shell";
import { SEQUENCE_EMAILS, SEQUENCE_LENGTH } from "@/lib/emails/sequence-content";
import type { User } from "@/generated/prisma/client";

export class SequenceError extends Error {}

const DAY_MS = 24 * 60 * 60 * 1000;
// docs/15-email-sequence.md: "every 2-3 days, ~18 days total" — 7 emails at
// a 3-day cadence spans 18 days.
const CADENCE_DAYS = 3;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Landing-page capture — a prospect, not a user, so no auth involved.
// Re-submitting an already-enrolled address is a silent no-op (don't leak
// enrollment state, don't restart the sequence).
export async function enrollInSequence(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new SequenceError("Enter a valid email address.");
  }

  const existing = await prisma.sequenceEnrollment.findUnique({ where: { email: normalized } });
  if (existing) return existing;

  const enrollment = await prisma.sequenceEnrollment.create({ data: { email: normalized } });
  await prisma.auditLog.create({
    data: { actorId: null, action: "sequence.enrolled", target: enrollment.id, metadata: { email: normalized } },
  });
  return enrollment;
}

export async function unsubscribeFromSequence(enrollmentId: string) {
  const enrollment = await prisma.sequenceEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return null;
  if (enrollment.unsubscribedAt) return enrollment;

  const updated = await prisma.sequenceEnrollment.update({
    where: { id: enrollmentId },
    data: { unsubscribedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { actorId: null, action: "sequence.unsubscribed", target: enrollmentId, metadata: {} },
  });
  return updated;
}

function buildSequenceEmailHtml(step: number, appBaseUrl: string, unsubscribeUrl: string) {
  const email = SEQUENCE_EMAILS.find((e) => e.step === step);
  if (!email) throw new SequenceError(`No sequence email for step ${step}.`);

  const bodyHtml =
    email.paragraphs
      .map((p) => `<p style="margin: 0 0 16px;">${p.replaceAll("{{URL}}", appBaseUrl)}</p>`)
      .join("\n") +
    // docs/15 sequence notes: "Unsubscribe: prominent, every email, one click."
    `<p style="margin: 24px 0 0; font-size: 12px; color: #8a8378;"><a href="${unsubscribeUrl}" style="color: #8a8378;">Unsubscribe</a> — one click, no questions.</p>`;

  return { subject: email.subject, html: emailShell({ preheader: email.subject, bodyHtml }) };
}

// No email provider is wired up (src/lib/email.ts logs instead of sending) —
// same dev-sender path every other email in the app uses.
async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
  console.log(html);
}

// docs/15's send cadence, minus the scheduler this repo doesn't have: an
// admin triggers a processing pass, which sends every enrollment's due email
// and schedules the next one. Idempotent per pass — an enrollment's
// nextSendAt moves forward before the next pass can pick it up again.
export async function processDueSequenceSends(admin: User) {
  if (admin.role !== "admin") {
    throw new SequenceError("Only admins can process sequence sends.");
  }
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const due = await prisma.sequenceEnrollment.findMany({
    where: { nextSendAt: { lte: new Date() }, completedAt: null, unsubscribedAt: null },
    orderBy: { nextSendAt: "asc" },
  });

  let sent = 0;
  for (const enrollment of due) {
    const unsubscribeUrl = `${appBaseUrl}/sequence/unsubscribe/${enrollment.id}`;
    const { subject, html } = buildSequenceEmailHtml(enrollment.nextStep, appBaseUrl, unsubscribeUrl);
    await sendEmail(enrollment.email, subject, html);

    const finished = enrollment.nextStep >= SEQUENCE_LENGTH;
    await prisma.sequenceEnrollment.update({
      where: { id: enrollment.id },
      data: finished
        ? { completedAt: new Date() }
        : { nextStep: enrollment.nextStep + 1, nextSendAt: new Date(Date.now() + CADENCE_DAYS * DAY_MS) },
    });
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "sequence.email_sent",
        target: enrollment.id,
        metadata: { step: enrollment.nextStep, email: enrollment.email },
      },
    });
    sent += 1;
  }

  return { sent, dueCount: due.length };
}

export async function getSequenceStats() {
  const [active, completed, unsubscribed, dueNow] = await Promise.all([
    prisma.sequenceEnrollment.count({ where: { completedAt: null, unsubscribedAt: null } }),
    prisma.sequenceEnrollment.count({ where: { completedAt: { not: null } } }),
    prisma.sequenceEnrollment.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.sequenceEnrollment.count({
      where: { nextSendAt: { lte: new Date() }, completedAt: null, unsubscribedAt: null },
    }),
  ]);
  return { active, completed, unsubscribed, dueNow };
}
