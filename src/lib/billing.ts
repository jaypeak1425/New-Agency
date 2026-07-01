import type Stripe from "stripe";
import { getStripe, planKeyToPlanId, type AgentPlanKey } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "incomplete" | "trialing" | "active" | "past_due" | "canceled" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

async function getOrCreateStripeCustomerId(user: User): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });
  return customer.id;
}

const PRICE_ID_ENV_VARS: Record<AgentPlanKey, string> = {
  monthly: "STRIPE_PRICE_ID_AGENT_MONTHLY",
  annual: "STRIPE_PRICE_ID_AGENT_ANNUAL",
};

export async function createCheckoutSession(
  user: User,
  appBaseUrl: string,
  planKey: AgentPlanKey = "monthly",
) {
  const stripe = getStripe();
  const envVar = PRICE_ID_ENV_VARS[planKey];
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new Error(`${envVar} env var is required.`);
  }

  const customerId = await getOrCreateStripeCustomerId(user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/billing`,
    client_reference_id: user.id,
    // Read back in the checkout.session.completed webhook and the success
    // redirect sync below — Stripe's session payload doesn't otherwise carry
    // which price/plan was purchased without an extra expand+API call.
    metadata: { planKey },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }
  return session.url;
}

export async function createPortalSession(user: User, appBaseUrl: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!subscription?.stripeCustomerId) {
    throw new Error("This account doesn't have a Stripe billing portal to manage.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appBaseUrl}/billing`,
  });
  return session.url;
}

// Called from the Checkout success redirect so access is granted immediately,
// ahead of the webhook (Session 6) which is the ongoing source of truth for
// renewals, payment failures, and cancellations.
export async function syncSubscriptionFromCheckoutSession(checkoutSessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["subscription"],
  });

  const userId = session.client_reference_id;
  const subscription = session.subscription as Stripe.Subscription | null;
  if (!userId || !subscription || typeof session.customer !== "string") {
    throw new Error("Checkout session is missing expected subscription data.");
  }

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  const planKey = (session.metadata?.planKey as AgentPlanKey | undefined) ?? "monthly";
  const plan = planKeyToPlanId(planKey);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: subscription.id,
        status: mapStripeStatus(subscription.status),
        plan,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      },
      update: {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: subscription.id,
        status: mapStripeStatus(subscription.status),
        plan,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "billing.checkout_completed",
        target: userId,
        metadata: { stripeSubscriptionId: subscription.id, status: subscription.status },
      },
    }),
  ]);

  return userId;
}

export function hasActiveAccess(status: string | undefined) {
  return status === "active" || status === "trialing";
}
