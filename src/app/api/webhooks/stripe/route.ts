import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { markEventProcessed, handleStripeWebhookEvent } from "@/lib/stripe-webhooks";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(error as Error).message}` },
      { status: 400 },
    );
  }

  const alreadyProcessed = await markEventProcessed(event);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await handleStripeWebhookEvent(event);

  return NextResponse.json({ received: true });
}
