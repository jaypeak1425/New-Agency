import { describe, it, expect, afterAll } from "vitest";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/webhooks/stripe/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy_for_signing_only");
const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_secret_for_vitest";
process.env.STRIPE_WEBHOOK_SECRET = secret;

function sign(payload: string) {
  return stripe.webhooks.generateTestHeaderString({ payload, secret });
}

async function post(eventId: string, eventType: string, dataObject: object) {
  const payload = JSON.stringify({
    id: eventId,
    object: "event",
    type: eventType,
    data: { object: dataObject },
  });
  const request = new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": sign(payload) },
    body: payload,
  });
  return POST(request);
}

const createdUserIds: string[] = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.subscription.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.auditLog.deleteMany({ where: { target: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe("Stripe webhook route", () => {
  it("rejects a request with an invalid signature", async () => {
    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=deadbeef" },
      body: JSON.stringify({ id: "evt_bad", type: "checkout.session.completed" }),
    });
    const res = await POST(request);
    expect(res.status).toBe(400);
  });

  it("processes the full subscription lifecycle and is idempotent on retries", async () => {
    const user = await prisma.user.create({
      data: {
        email: `e2e-vitest-webhook-${Date.now()}@example.com`,
        passwordHash: "unused",
        name: "Vitest Webhook",
      },
    });
    createdUserIds.push(user.id);

    const customerId = `cus_test_${user.id}`;
    const subscriptionId = `sub_test_${user.id}`;
    const checkoutEventId = `evt_test_checkout_${user.id}`;
    const subUpdatedEventId = `evt_test_sub_updated_${user.id}`;
    const invoiceFailedEventId = `evt_test_invoice_failed_${user.id}`;
    const subDeletedEventId = `evt_test_sub_deleted_${user.id}`;

    let res = await post(checkoutEventId, "checkout.session.completed", {
      id: "cs_test_1",
      object: "checkout.session",
      customer: customerId,
      subscription: subscriptionId,
      client_reference_id: user.id,
    });
    expect(res.status).toBe(200);

    let sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(sub?.status).toBe("incomplete");
    expect(sub?.stripeCustomerId).toBe(customerId);
    expect(sub?.stripeSubscriptionId).toBe(subscriptionId);

    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    res = await post(subUpdatedEventId, "customer.subscription.updated", {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "active",
      items: { data: [{ current_period_end: periodEnd }] },
    });
    expect(res.status).toBe(200);

    sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(sub?.status).toBe("active");
    expect(sub?.currentPeriodEnd?.getTime()).toBe(periodEnd * 1000);

    // Replaying the identical event id with a DIFFERENT payload must be a
    // no-op — proves idempotency is keyed on event id, not payload content.
    const dupRes = await post(subUpdatedEventId, "customer.subscription.updated", {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "past_due",
      items: { data: [{ current_period_end: periodEnd }] },
    });
    expect(dupRes.status).toBe(200);
    expect(await dupRes.json()).toMatchObject({ duplicate: true });

    sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(sub?.status).toBe("active");

    res = await post(invoiceFailedEventId, "invoice.payment_failed", {
      id: "in_test_1",
      object: "invoice",
      customer: customerId,
      parent: { subscription_details: { subscription: subscriptionId } },
    });
    expect(res.status).toBe(200);

    sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(sub?.status).toBe("past_due");

    res = await post(subDeletedEventId, "customer.subscription.deleted", {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "canceled",
      items: { data: [{ current_period_end: periodEnd }] },
    });
    expect(res.status).toBe(200);

    sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(sub?.status).toBe("canceled");

    const webhookEventIds = await prisma.webhookEvent.findMany({
      where: { id: { in: [checkoutEventId, subUpdatedEventId, invoiceFailedEventId, subDeletedEventId] } },
    });
    expect(webhookEventIds).toHaveLength(4);

    await prisma.webhookEvent.deleteMany({
      where: { id: { in: [checkoutEventId, subUpdatedEventId, invoiceFailedEventId, subDeletedEventId] } },
    });
  });
});
