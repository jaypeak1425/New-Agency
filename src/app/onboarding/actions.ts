"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { completeOnboarding, skipOnboarding } from "@/lib/onboarding";
import type {
  Avatar,
  TenureBand,
  IncomeBand,
  InteractionPreference,
  OutputPreference,
  ReminderFrequency,
} from "@/generated/prisma/client";

export async function completeOnboardingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const goalIncomeRaw = String(formData.get("goalIncome") ?? "").trim();

  await completeOnboarding(user.id, {
    tenureBand: String(formData.get("tenureBand")) as TenureBand,
    currentIncomeBand: String(formData.get("currentIncomeBand")) as IncomeBand,
    goalIncome: goalIncomeRaw ? Number(goalIncomeRaw) : null,
    avatarMix: formData.getAll("avatarMix") as Avatar[],
    interactionPreference: String(formData.get("interactionPreference")) as InteractionPreference,
    outputPreference: String(formData.get("outputPreference")) as OutputPreference,
    reminderFrequency: String(formData.get("reminderFrequency")) as ReminderFrequency,
    hasCpaRelationship: formData.get("hasCpaRelationship") === "on",
    hasAttorneyRelationship: formData.get("hasAttorneyRelationship") === "on",
    imoAffiliation: String(formData.get("imoAffiliation") ?? "").trim() || null,
  });

  redirect("/app");
}

export async function skipOnboardingAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await skipOnboarding(user.id);
  redirect("/app");
}
