"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { ScenarioError, createScenario, saveIntakeAnswers, type IntakeAnswers } from "@/lib/scenarios";
import { WholesalerActionError, notifyWholesalerForScenario } from "@/lib/wholesaler";
import type {
  BusinessOwnerStatus,
  BusinessStructure,
  ExistingRelationship,
  HealthRating,
  IncomeRevenueRange,
  IntakeGoal,
  TobaccoUse,
} from "@/generated/prisma/client";

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

function optionalString(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function optionalInt(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalEnum<T extends string>(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return (value || null) as T | null;
}

export async function completeIntakeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");

  const answers: IntakeAnswers = {
    clientDescription: optionalString(formData, "clientDescription"),
    primaryAge: optionalInt(formData, "primaryAge"),
    healthRating: optionalEnum<HealthRating>(formData, "healthRating"),
    healthNotes: optionalString(formData, "healthNotes"),
    tobaccoUse: optionalEnum<TobaccoUse>(formData, "tobaccoUse"),
    tobaccoNotes: optionalString(formData, "tobaccoNotes"),
    businessOwnerStatus: optionalEnum<BusinessOwnerStatus>(formData, "businessOwnerStatus"),
    businessStructure: optionalEnum<BusinessStructure>(formData, "businessStructure"),
    coOwnersNotes: optionalString(formData, "coOwnersNotes"),
    keyEmployeesCount: optionalInt(formData, "keyEmployeesCount"),
    keyEmployeesNotes: optionalString(formData, "keyEmployeesNotes"),
    primaryGoals: formData.getAll("primaryGoals") as IntakeGoal[],
    goalsNotes: optionalString(formData, "goalsNotes"),
    existingRelationship: optionalEnum<ExistingRelationship>(formData, "existingRelationship"),
    incomeRevenueRange: optionalEnum<IncomeRevenueRange>(formData, "incomeRevenueRange"),
  };

  try {
    await saveIntakeAnswers(user.id, scenarioId, answers);
  } catch (error) {
    const message = error instanceof ScenarioError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios/${scenarioId}/intake?error=${encodeURIComponent(message)}`);
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
