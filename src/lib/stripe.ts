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

export const AGENT_MONTHLY_PLAN = "agent_monthly_297";
// Owner directive 2026-07-06: $297/mo globally. Annual keeps the ~17%
// prepay discount: $2,970/yr (vs $3,564 at 12 × $297).
export const AGENT_ANNUAL_PLAN = "agent_annual_2970";

export type AgentPlanKey = "monthly" | "annual";

export function planKeyToPlanId(planKey: AgentPlanKey): string {
  return planKey === "annual" ? AGENT_ANNUAL_PLAN : AGENT_MONTHLY_PLAN;
}
