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
// CLAUDE.md / docs/20-business-plan.md: "~$970-980/yr, ~16-20% discount for
// annual prepay." $970 sits at the low end of that locked range.
export const AGENT_ANNUAL_PLAN = "agent_annual_970";

export type AgentPlanKey = "monthly" | "annual";

export function planKeyToPlanId(planKey: AgentPlanKey): string {
  return planKey === "annual" ? AGENT_ANNUAL_PLAN : AGENT_MONTHLY_PLAN;
}
