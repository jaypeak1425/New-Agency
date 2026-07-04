"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateBookOfBusiness, type BookOfBusinessInput } from "@/lib/onboarding";

function optionalInt(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalPercent(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed / 100 : null;
}

export async function updateBookOfBusinessAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const input: BookOfBusinessInput = {
    businessOwnersWithCoOwnersCount: optionalInt(formData, "businessOwnersWithCoOwnersCount"),
    businessOwnersSoloCount: optionalInt(formData, "businessOwnersSoloCount"),
    hnwIndividualsCount: optionalInt(formData, "hnwIndividualsCount"),
    qualifiedFundHeavyCount: optionalInt(formData, "qualifiedFundHeavyCount"),
    familyLegacyCount: optionalInt(formData, "familyLegacyCount"),
    bookAddressableFilterOverridePercent: optionalPercent(formData, "bookAddressableFilterOverridePercent"),
  };

  await updateBookOfBusiness(user.id, input);
  // Phase 6 Session 1's on-screen celebration ("You just uncovered $X in
  // opportunities") — the settings page renders the banner when this flag is
  // present and the book actually computes to a number.
  redirect("/app/settings?celebrate=1");
}
