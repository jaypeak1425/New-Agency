"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/billing";

async function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function startCheckoutAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const appBaseUrl = await getAppBaseUrl();
  const url = await createCheckoutSession(user, appBaseUrl);
  redirect(url);
}

export async function openBillingPortalAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const appBaseUrl = await getAppBaseUrl();
  const url = await createPortalSession(user, appBaseUrl);
  redirect(url);
}
