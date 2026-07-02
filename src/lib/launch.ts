import { prisma } from "@/lib/prisma";

// The phased Railway launch (docs/24-railway-launch-runbook.md). Each phase
// maps to docs/20-business-plan.md's go-to-market timeline: the app is built
// to come up with partial configuration and degrade gracefully — Phase A
// runs a comped design-partner pilot with no Stripe at all, which is exactly
// how the business plan spends months 1-3.

export function isMonthlyBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_AGENT_MONTHLY);
}

export function isAnnualBillingConfigured(): boolean {
  return isMonthlyBillingConfigured() && Boolean(process.env.STRIPE_PRICE_ID_AGENT_ANNUAL);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

// src/lib/email.ts is a dev logger until a real provider is wired in — this
// flips when that happens, and the readiness panel reads it rather than
// letting anyone assume invites/resets are actually delivering.
export function isEmailDeliveryConfigured(): boolean {
  return false;
}

export interface ReadinessItem {
  label: string;
  ok: boolean;
  detail: string;
}

export interface ReadinessPhase {
  phase: string;
  goal: string;
  items: ReadinessItem[];
}

export async function getLaunchReadiness(): Promise<ReadinessPhase[]> {
  let dbReachable = true;
  let adminCount = 0;
  let documentedStrategies = 0;
  let defaultAdminEmailInUse = false;
  try {
    [adminCount, documentedStrategies] = await Promise.all([
      prisma.user.count({ where: { role: "admin" } }),
      prisma.strategy.count({ where: { status: "documented" } }),
    ]);
    defaultAdminEmailInUse =
      (await prisma.user.count({ where: { role: "admin", email: "admin@example.com" } })) > 0;
  } catch {
    dbReachable = false;
  }

  return [
    {
      phase: "Phase A — Pilot",
      goal: "Design partners in, access comped by an admin. No payments taken.",
      items: [
        {
          label: "Database reachable",
          ok: dbReachable,
          detail: dbReachable
            ? "Postgres is connected and migrations can run."
            : "DATABASE_URL is missing or the database is unreachable.",
        },
        {
          label: "SESSION_SECRET set",
          ok: Boolean(process.env.SESSION_SECRET),
          detail: Boolean(process.env.SESSION_SECRET)
            ? "Sessions can be signed."
            : "Without it every login crashes — /api/health fails until this is set.",
        },
        {
          label: "APP_BASE_URL set",
          ok: Boolean(process.env.APP_BASE_URL),
          detail: process.env.APP_BASE_URL
            ? `Links in emails point at ${process.env.APP_BASE_URL}.`
            : "Falls back to the request host — set it once the Railway domain is generated.",
        },
        {
          label: "Admin account seeded",
          ok: adminCount > 0,
          detail:
            adminCount > 0
              ? `${adminCount} admin account(s) exist.`
              : "Run the seed (railway run npm run db:seed) to create the admin login.",
        },
        {
          label: "Default admin credentials replaced",
          ok: adminCount > 0 && !defaultAdminEmailInUse,
          detail: defaultAdminEmailInUse
            ? "admin@example.com is still an admin — set SEED_ADMIN_EMAIL/PASSWORD before seeding in production, or change it."
            : adminCount > 0
              ? "No default-seed admin email in use."
              : "Seed an admin first.",
        },
        {
          label: "Strategy library seeded",
          ok: documentedStrategies > 0,
          detail:
            documentedStrategies > 0
              ? `${documentedStrategies} documented strategies live (Brain Lock: only these are ever recommended).`
              : "Run the seed — without it Atlas has an empty library and recommends nothing.",
        },
      ],
    },
    {
      phase: "Phase B — Paid launch",
      goal: "Public $97/mo signups through Stripe. Until this is green, the billing page runs in pilot mode.",
      items: [
        {
          label: "Stripe secret key",
          ok: Boolean(process.env.STRIPE_SECRET_KEY),
          detail: "STRIPE_SECRET_KEY (test mode first, then live).",
        },
        {
          label: "Monthly price ($97/mo)",
          ok: Boolean(process.env.STRIPE_PRICE_ID_AGENT_MONTHLY),
          detail: "STRIPE_PRICE_ID_AGENT_MONTHLY — create the Price in Stripe, paste its id.",
        },
        {
          label: "Stripe webhook secret",
          ok: isStripeWebhookConfigured(),
          detail:
            "STRIPE_WEBHOOK_SECRET — add an endpoint for /api/webhooks/stripe; without it renewals, cancellations, and payment failures never reach the app.",
        },
        {
          label: "Annual price ($970/yr) — optional",
          ok: Boolean(process.env.STRIPE_PRICE_ID_AGENT_ANNUAL),
          detail:
            "STRIPE_PRICE_ID_AGENT_ANNUAL — the annual button only appears once this is set.",
        },
      ],
    },
    {
      phase: "Phase C — Outreach & comms",
      goal: "Emails actually deliver: invites, password resets, billing alerts, the docs/15 sequence.",
      items: [
        {
          label: "Email provider wired",
          ok: isEmailDeliveryConfigured(),
          detail:
            "src/lib/email.ts logs to the deploy console instead of sending. Until a provider (Resend/Postmark/etc.) replaces it, copy invite and reset links out of the Railway logs.",
        },
      ],
    },
    {
      phase: "Phase D — IMO white-label",
      goal: "IMO contracts, seats, principal portals. No extra env vars — operational readiness only.",
      items: [
        {
          label: "No additional configuration",
          ok: true,
          detail:
            "IMO features are DB-driven. Known gap: logos are hosted URLs (no object storage for uploads).",
        },
      ],
    },
  ];
}
