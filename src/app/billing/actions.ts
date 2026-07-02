"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/billing";
import { isMonthlyBillingConfigured, isAnnualBillingConfigured } from "@/lib/launch";
import type { AgentPlanKey } from "@/lib/stripe";

async function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function startCheckoutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const planKey: AgentPlanKey = formData.get("planKey") === "annual" ? "annual" : "monthly";

  // Phase-gated billing (docs/24-railway-launch-runbook.md): the page hides
  // these buttons when Stripe isn't configured, but a stale tab or direct
  // POST shouldn't turn into an unhandled crash either.
  const configured = planKey === "annual" ? isAnnualBillingConfigured() : isMonthlyBillingConfigured();
  if (!configured) {
    redirect(
      `/billing?error=${encodeURIComponent("Self-serve billing isn't live yet — access is granted by an admin during the pilot.")}`,
    );
  }

  const appBaseUrl = await getAppBaseUrl();
  const url = await createCheckoutSession(user, appBaseUrl, planKey);
  redirect(url);
}

export async function openBillingPortalAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const appBaseUrl = await getAppBaseUrl();
  const url = await createPortalSession(user, appBaseUrl);
  redirect(url);
}
