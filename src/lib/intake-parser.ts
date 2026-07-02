import { callModel } from "@/lib/ai";
import type { IntakeAnswers } from "@/lib/scenarios";
import {
  HealthRating,
  TobaccoUse,
  BusinessOwnerStatus,
  BusinessStructure,
  IntakeGoal,
  ExistingRelationship,
  RelationshipType,
  IncomeRevenueRange,
  NetWorthEstimate,
  QualifiedFundsEstimate,
  MaritalStatus,
  BeneficiaryStructure,
  ControlPreference,
  FundingPreference,
  ExistingStructure,
  UrgencyDriver,
} from "@/generated/prisma/enums";

// The free-text "I've got a guy" layer (docs/03-intake-flow.md's original
// design, deferred since Phase 3 for lack of an AI backend). The model's ONLY
// job is extraction: map the agent's paragraph onto the same structured
// fields the 10-question form writes. Brain Lock holds — the model never
// picks strategies, and everything it returns passes through a whitelist
// validator (coerceParsedAnswers) that drops anything outside the schema's
// own enum values, so a hallucinated value can never reach the database.

type FieldSpec =
  | { kind: "enum"; values: readonly string[] }
  | { kind: "enum_array"; values: readonly string[] }
  | { kind: "int"; min: number; max: number }
  | { kind: "boolean" }
  | { kind: "string" };

const FIELD_SPECS: Record<string, FieldSpec> = {
  primaryAge: { kind: "int", min: 0, max: 120 },
  healthRating: { kind: "enum", values: Object.values(HealthRating) },
  healthNotes: { kind: "string" },
  tobaccoUse: { kind: "enum", values: Object.values(TobaccoUse) },
  tobaccoNotes: { kind: "string" },
  businessOwnerStatus: { kind: "enum", values: Object.values(BusinessOwnerStatus) },
  businessStructure: { kind: "enum", values: Object.values(BusinessStructure) },
  coOwnersNotes: { kind: "string" },
  keyEmployeesCount: { kind: "int", min: 0, max: 100000 },
  keyEmployeesNotes: { kind: "string" },
  primaryGoals: { kind: "enum_array", values: Object.values(IntakeGoal) },
  goalsNotes: { kind: "string" },
  existingRelationship: { kind: "enum", values: Object.values(ExistingRelationship) },
  relationshipType: { kind: "enum", values: Object.values(RelationshipType) },
  incomeRevenueRange: { kind: "enum", values: Object.values(IncomeRevenueRange) },
  netWorthEstimate: { kind: "enum", values: Object.values(NetWorthEstimate) },
  qualifiedFundsEstimate: { kind: "enum", values: Object.values(QualifiedFundsEstimate) },
  hasDependentsUnder18: { kind: "boolean" },
  maritalStatus: { kind: "enum", values: Object.values(MaritalStatus) },
  stateOfResidence: { kind: "string" },
  illiquidNetWorth: { kind: "boolean" },
  estateExceedsExemption: { kind: "boolean" },
  concentratedLowBasisPosition: { kind: "boolean" },
  beneficiaryStructure: { kind: "enum", values: Object.values(BeneficiaryStructure) },
  controlPreference: { kind: "enum", values: Object.values(ControlPreference) },
  fundingPreference: { kind: "enum", values: Object.values(FundingPreference) },
  existingStructures: { kind: "enum_array", values: Object.values(ExistingStructure) },
  urgencyDriver: { kind: "enum", values: Object.values(UrgencyDriver) },
  existingPolicyTransfer: { kind: "boolean" },
};

const MAX_STRING_LENGTH = 2000;

export interface ParsedIntake {
  answers: Partial<IntakeAnswers>;
  extractedFields: string[];
}

// Whitelist validation of whatever the model returned: unknown keys are
// dropped, enum values outside the schema are dropped, numbers are bounded,
// strings are trimmed and capped. Pure and deterministic — unit-tested
// independently of any model.
export function coerceParsedAnswers(raw: unknown): ParsedIntake {
  const answers: Record<string, unknown> = {};
  const extractedFields: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { answers: {}, extractedFields: [] };
  }

  for (const [field, spec] of Object.entries(FIELD_SPECS)) {
    const value = (raw as Record<string, unknown>)[field];
    if (value === undefined || value === null) continue;

    switch (spec.kind) {
      case "enum":
        if (typeof value === "string" && spec.values.includes(value)) {
          answers[field] = value;
          extractedFields.push(field);
        }
        break;
      case "enum_array":
        if (Array.isArray(value)) {
          const valid = value.filter(
            (v): v is string => typeof v === "string" && spec.values.includes(v),
          );
          if (valid.length > 0) {
            answers[field] = [...new Set(valid)];
            extractedFields.push(field);
          }
        }
        break;
      case "int": {
        const n = typeof value === "number" ? Math.round(value) : NaN;
        if (Number.isInteger(n) && n >= spec.min && n <= spec.max) {
          answers[field] = n;
          extractedFields.push(field);
        }
        break;
      }
      case "boolean":
        if (typeof value === "boolean") {
          answers[field] = value;
          extractedFields.push(field);
        }
        break;
      case "string":
        if (typeof value === "string" && value.trim()) {
          answers[field] = value.trim().slice(0, MAX_STRING_LENGTH);
          extractedFields.push(field);
        }
        break;
    }
  }

  return { answers: answers as Partial<IntakeAnswers>, extractedFields };
}

function buildSystemPrompt(): string {
  const fieldLines = Object.entries(FIELD_SPECS).map(([field, spec]) => {
    switch (spec.kind) {
      case "enum":
        return `- ${field}: one of ${spec.values.join(" | ")}`;
      case "enum_array":
        return `- ${field}: array drawn from ${spec.values.join(" | ")}`;
      case "int":
        return `- ${field}: integer`;
      case "boolean":
        return `- ${field}: true or false`;
      case "string":
        return `- ${field}: short free text, quoting or closely paraphrasing the agent`;
    }
  });

  return [
    "You extract structured intake fields from an insurance producer's plain-language description of a client (\"I've got a guy...\").",
    "Return ONLY a JSON object — no prose, no markdown fences.",
    "Include a field ONLY when the description clearly states or directly implies it. When in doubt, omit the field. Never guess, never infer beyond what is said.",
    "Do not recommend strategies or products. Extraction only.",
    "Fields:",
    ...fieldLines,
  ].join("\n");
}

// Defensive: models occasionally wrap JSON in fences despite instructions.
function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function parseIntakeDescription(text: string): Promise<ParsedIntake> {
  // Extraction across a 29-field schema with strict no-guessing rules is the
  // "complex" tier of CLAUDE.md's routing — accuracy over speed here.
  const responseText = await callModel("complex", [{ role: "user", content: text }], {
    system: buildSystemPrompt(),
    maxTokens: 1500,
  });

  const parsed = coerceParsedAnswers(extractJson(responseText));
  // The agent's own words are the clientDescription — never the model's.
  parsed.answers.clientDescription = text.trim().slice(0, MAX_STRING_LENGTH);
  return parsed;
}
