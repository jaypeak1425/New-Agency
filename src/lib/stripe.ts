import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY env var is required.");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export const AGENT_MONTHLY_PLAN = "agent_monthly_97";
