"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { ScenarioError, createScenario } from "@/lib/scenarios";
import { WholesalerActionError, notifyWholesalerForScenario } from "@/lib/wholesaler";

async function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function createScenarioAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const label = String(formData.get("label") ?? "");
  const notes = String(formData.get("notes") ?? "") || undefined;

  try {
    await createScenario(user.id, label, notes);
  } catch (error) {
    const message = error instanceof ScenarioError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios?error=${encodeURIComponent(message)}`);
  }
  redirect("/app/scenarios");
}

export async function notifyWholesalerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");
  const appBaseUrl = await getAppBaseUrl();

  try {
    await notifyWholesalerForScenario(user, scenarioId, appBaseUrl);
  } catch (error) {
    const message = error instanceof WholesalerActionError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios?error=${encodeURIComponent(message)}`);
  }
  redirect("/app/scenarios");
}
