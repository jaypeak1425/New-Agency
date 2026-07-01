import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

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

async function logUnmatched(eventType: string, context: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: "billing.webhook.unmatched",
      target: "unknown",
      metadata: { eventType, ...context },
    },
  });
}

// checkout.session.completed carries client_reference_id (our userId) but not
// the full Subscription object — this only links the ids together. The
// authoritative status comes moments later via customer.subscription.*,
// handled below. This keeps the webhook handler free of live API calls.
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!userId || !customerId) {
    await logUnmatched("checkout.session.completed", { sessionId: session.id });
    return;
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: "incomplete",
    },
    update: {
      stripeCustomerId: customerId,
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "billing.webhook.checkout_completed",
      target: userId,
      metadata: { stripeSubscriptionId: subscriptionId ?? null },
    },
  });
}

async function findSubscriptionRow(stripeSubscriptionId: string, stripeCustomerId: string) {
  return (
    (await prisma.subscription.findUnique({ where: { stripeSubscriptionId } })) ??
    (await prisma.subscription.findUnique({ where: { stripeCustomerId } }))
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const row = await findSubscriptionRow(subscription.id, customerId);

  if (!row) {
    await logUnmatched("customer.subscription.updated", {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
    });
    return;
  }

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: row.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: mapStripeStatus(subscription.status),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: row.userId,
        action: "billing.webhook.subscription_updated",
        target: row.userId,
        metadata: { stripeSubscriptionId: subscription.id, status: subscription.status },
      },
    }),
  ]);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const row = await findSubscriptionRow(subscription.id, customerId);

  if (!row) {
    await logUnmatched("customer.subscription.deleted", {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
    });
    return;
  }

  await prisma.$transaction([
    prisma.subscription.update({ where: { id: row.id }, data: { status: "canceled" } }),
    prisma.auditLog.create({
      data: {
        actorId: row.userId,
        action: "billing.webhook.subscription_deleted",
        target: row.userId,
        metadata: { stripeSubscriptionId: subscription.id },
      },
    }),
  ]);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!stripeSubscriptionId && !customerId) {
    await logUnmatched("invoice.payment_failed", { invoiceId: invoice.id });
    return;
  }

  const row = stripeSubscriptionId
    ? await findSubscriptionRow(stripeSubscriptionId, customerId ?? "")
    : await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId } });

  if (!row) {
    await logUnmatched("invoice.payment_failed", { invoiceId: invoice.id, stripeSubscriptionId });
    return;
  }

  await prisma.$transaction([
    prisma.subscription.update({ where: { id: row.id }, data: { status: "past_due" } }),
    prisma.auditLog.create({
      data: {
        actorId: row.userId,
        action: "billing.webhook.payment_failed",
        target: row.userId,
        metadata: { invoiceId: invoice.id },
      },
    }),
  ]);
}

// Returns true if this event was already processed (caller should no-op).
export async function markEventProcessed(event: Stripe.Event): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
    return false;
  } catch {
    // Unique constraint violation on `id` — we've already handled this event.
    return true;
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.created":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }
}
