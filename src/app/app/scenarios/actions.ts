"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import {
  ScenarioError,
  createScenario,
  saveIntakeAnswers,
  saveParsedIntakeDraft,
  updateScenarioStatus,
  type IntakeAnswers,
} from "@/lib/scenarios";
import { AiError } from "@/lib/ai";
import { parseIntakeDescription } from "@/lib/intake-parser";
import { WholesalerActionError, notifyWholesalerForScenario } from "@/lib/wholesaler";
import {
  saveLifeUnderwritingIntake,
  saveAnnuityIntake,
  type LifeUnderwritingAnswers,
  type AnnuityIntakeAnswers,
} from "@/lib/underwriting";
import { saveStrategyEstimate } from "@/lib/commission";
import type {
  BeneficiaryStructure,
  BusinessOwnerStatus,
  BusinessStructure,
  ControlPreference,
  DuiHistory,
  EstatePlanningIntent,
  ExistingRelationship,
  ExistingStructure,
  FundingPreference,
  HealthRating,
  IncomeRevenueRange,
  IncomeStartTiming,
  IntakeGoal,
  MajorDiagnosis,
  MaritalStatus,
  NetWorthEstimate,
  ProductType,
  QualifiedFundsEstimate,
  RelationshipType,
  ScenarioStatus,
  SourceOfFunds,
  TaxBracket,
  TobaccoUse,
  UrgencyDriver,
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

function optionalBoolean(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function parseIntakeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!description) {
    redirect(
      `/app/scenarios/${scenarioId}/intake?error=${encodeURIComponent("Describe the client first — a sentence or two is enough.")}`,
    );
  }

  let extractedCount = 0;
  try {
    const { answers, extractedFields } = await parseIntakeDescription(description);
    await saveParsedIntakeDraft(user.id, scenarioId, answers, extractedFields);
    extractedCount = extractedFields.length;
  } catch (error) {
    const message =
      error instanceof AiError || error instanceof ScenarioError
        ? error.message
        : "Something went wrong parsing the description.";
    redirect(`/app/scenarios/${scenarioId}/intake?error=${encodeURIComponent(message)}`);
  }
  redirect(`/app/scenarios/${scenarioId}/intake?parsed=${extractedCount}`);
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
    relationshipType: optionalEnum<RelationshipType>(formData, "relationshipType"),
    incomeRevenueRange: optionalEnum<IncomeRevenueRange>(formData, "incomeRevenueRange"),
    netWorthEstimate: optionalEnum<NetWorthEstimate>(formData, "netWorthEstimate"),
    qualifiedFundsEstimate: optionalEnum<QualifiedFundsEstimate>(formData, "qualifiedFundsEstimate"),
    hasDependentsUnder18: optionalBoolean(formData, "hasDependentsUnder18"),
    maritalStatus: optionalEnum<MaritalStatus>(formData, "maritalStatus"),
    stateOfResidence: optionalString(formData, "stateOfResidence"),
    illiquidNetWorth: optionalBoolean(formData, "illiquidNetWorth"),
    estateExceedsExemption: optionalBoolean(formData, "estateExceedsExemption"),
    concentratedLowBasisPosition: optionalBoolean(formData, "concentratedLowBasisPosition"),
    beneficiaryStructure: optionalEnum<BeneficiaryStructure>(formData, "beneficiaryStructure"),
    controlPreference: optionalEnum<ControlPreference>(formData, "controlPreference"),
    fundingPreference: optionalEnum<FundingPreference>(formData, "fundingPreference"),
    existingStructures: formData.getAll("existingStructures") as ExistingStructure[],
    urgencyDriver: optionalEnum<UrgencyDriver>(formData, "urgencyDriver"),
    existingPolicyTransfer: optionalBoolean(formData, "existingPolicyTransfer"),
  };

  try {
    await saveIntakeAnswers(user.id, scenarioId, answers);
  } catch (error) {
    const message = error instanceof ScenarioError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios/${scenarioId}/intake?error=${encodeURIComponent(message)}`);
  }
  redirect("/app/scenarios");
}

export async function completeLifeUnderwritingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");

  const answers: LifeUnderwritingAnswers = {
    heightInches: optionalInt(formData, "heightInches"),
    weightLbs: optionalInt(formData, "weightLbs"),
    majorDiagnoses: formData.getAll("majorDiagnoses") as MajorDiagnosis[],
    hospitalizationsOrSurgeriesNotes: optionalString(formData, "hospitalizationsOrSurgeriesNotes"),
    familyHistoryEarlyDeath: optionalBoolean(formData, "familyHistoryEarlyDeath"),
    occupation: optionalString(formData, "occupation"),
    hazardousOccupation: optionalBoolean(formData, "hazardousOccupation"),
    hobbies: optionalString(formData, "hobbies"),
    hazardousHobby: optionalBoolean(formData, "hazardousHobby"),
    duiHistory: optionalEnum<DuiHistory>(formData, "duiHistory"),
    foreignTravelPlanned: optionalBoolean(formData, "foreignTravelPlanned"),
    foreignTravelNotes: optionalString(formData, "foreignTravelNotes"),
    existingLifeInsuranceNotes: optionalString(formData, "existingLifeInsuranceNotes"),
  };

  try {
    await saveLifeUnderwritingIntake(user.id, scenarioId, answers);
  } catch (error) {
    const message = error instanceof ScenarioError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios/${scenarioId}/underwriting/life?error=${encodeURIComponent(message)}`);
  }
  redirect(`/app/scenarios/${scenarioId}/intake`);
}

export async function completeAnnuityIntakeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");

  const answers: AnnuityIntakeAnswers = {
    liquidNetWorthRange: optionalEnum<IncomeRevenueRange>(formData, "liquidNetWorthRange"),
    sourceOfFunds: optionalEnum<SourceOfFunds>(formData, "sourceOfFunds"),
    allocationAmount: optionalInt(formData, "allocationAmount"),
    desiredIncomeStartDate: optionalEnum<IncomeStartTiming>(formData, "desiredIncomeStartDate"),
    existingAnnuityContractsNotes: optionalString(formData, "existingAnnuityContractsNotes"),
    taxBracket: optionalEnum<TaxBracket>(formData, "taxBracket"),
    estatePlanningIntent: optionalEnum<EstatePlanningIntent>(formData, "estatePlanningIntent"),
    needsLiquidityWithin5to7Years: optionalBoolean(formData, "needsLiquidityWithin5to7Years"),
  };

  try {
    await saveAnnuityIntake(user.id, scenarioId, answers);
  } catch (error) {
    const message = error instanceof ScenarioError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios/${scenarioId}/underwriting/annuity?error=${encodeURIComponent(message)}`);
  }
  redirect(`/app/scenarios/${scenarioId}/intake`);
}

export async function updateScenarioStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");
  const status = String(formData.get("status") ?? "") as ScenarioStatus;

  try {
    await updateScenarioStatus(user.id, scenarioId, status);
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

export async function saveStrategyEstimateAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarioId = String(formData.get("scenarioId") ?? "");
  const strategyId = String(formData.get("strategyId") ?? "");
  const productType = optionalEnum<ProductType>(formData, "productType");
  const annualPremium = optionalInt(formData, "annualPremium");
  const faceAmount = optionalInt(formData, "faceAmount");

  if (!productType) {
    redirect(
      `/app/scenarios/${scenarioId}/intake?error=${encodeURIComponent("Pick a product type before saving the estimate.")}`,
    );
  }

  try {
    await saveStrategyEstimate(user.id, scenarioId, strategyId, productType, annualPremium, faceAmount);
  } catch (error) {
    const message = error instanceof ScenarioError ? error.message : "Something went wrong.";
    redirect(`/app/scenarios/${scenarioId}/intake?error=${encodeURIComponent(message)}`);
  }
  redirect(`/app/scenarios/${scenarioId}/intake`);
}
