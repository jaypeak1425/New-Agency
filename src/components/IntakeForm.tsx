"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SubmitButton } from "@/components/SubmitButton";
import type { Scenario } from "@/generated/prisma/client";

// The dynamic "I've got a guy" intake (the docs/03 conversational flow,
// finally behaving like a conversation instead of a wall of 20 questions):
//  - the business questions (Q5–Q7) appear only when Q4 says business owner
//    (and unmounting them means switching away correctly clears stale
//    answers — the server action nulls absent fields);
//  - the two optional sections collapse behind toggles, auto-opened when
//    they already hold answers or when a "needs more info" link targets one;
//  - a live progress line counts what's answered as you type, with the
//    denominator itself adapting to the answers (business questions only
//    count for business owners).
// Field names are identical to the original server-rendered form —
// completeIntakeAction is untouched.

const radioClass = "h-4 w-4 border-border text-navy focus:ring-gold";
const checkboxClass = "h-4 w-4 rounded border-border text-navy focus:ring-gold";
const optionLabelClass = "flex items-center gap-2 text-sm text-charcoal";
const textInputClass =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

const CORE_FIELDS = [
  "primaryAge",
  "healthRating",
  "tobaccoUse",
  "businessOwnerStatus",
  "primaryGoals",
  "existingRelationship",
  "incomeRevenueRange",
] as const;
const BUSINESS_FIELDS = ["businessStructure", "coOwnersNotes", "keyEmployeesCount"] as const;

function initialProgress(s: Scenario) {
  const isOwner = s.businessOwnerStatus === "business_owner";
  const answers: Record<(typeof CORE_FIELDS | typeof BUSINESS_FIELDS)[number], boolean> = {
    primaryAge: s.primaryAge !== null,
    healthRating: s.healthRating !== null,
    tobaccoUse: s.tobaccoUse !== null,
    businessOwnerStatus: s.businessOwnerStatus !== null,
    primaryGoals: s.primaryGoals.length > 0,
    existingRelationship: s.existingRelationship !== null,
    incomeRevenueRange: s.incomeRevenueRange !== null,
    businessStructure: s.businessStructure !== null,
    coOwnersNotes: Boolean(s.coOwnersNotes?.trim()),
    keyEmployeesCount: s.keyEmployeesCount !== null,
  };
  const fields = isOwner ? [...CORE_FIELDS, ...BUSINESS_FIELDS] : [...CORE_FIELDS];
  return { answered: fields.filter((f) => answers[f]).length, total: fields.length };
}

function progressFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const has = (name: string) => data.getAll(name).some((v) => String(v).trim() !== "");
  const isOwner = String(data.get("businessOwnerStatus") ?? "") === "business_owner";
  const fields = isOwner ? [...CORE_FIELDS, ...BUSINESS_FIELDS] : [...CORE_FIELDS];
  return { answered: fields.filter(has).length, total: fields.length };
}

function SectionToggle({
  id,
  title,
  hint,
  defaultOpen,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="group border-t border-border pt-6">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-navy [&::-webkit-details-marker]:hidden">
        <span className="inline-block text-gold transition-transform group-open:rotate-90">
          &#9656;
        </span>
        {title}
        <span className="font-normal text-charcoal/50">— optional</span>
      </summary>
      <p className="mt-1 pl-5 text-xs text-charcoal/50">{hint}</p>
      <div className="pl-5">{children}</div>
    </details>
  );
}

export function IntakeForm({
  scenario,
  action,
  focusSection,
}: {
  scenario: Scenario;
  action: (formData: FormData) => Promise<void>;
  // Set by the "unlock more strategies" links on the recommendation card so
  // the targeted optional section arrives open.
  focusSection?: "avatar" | "estate" | "numbers" | null;
}) {
  const [ownerStatus, setOwnerStatus] = useState(scenario.businessOwnerStatus);
  const [progress, setProgress] = useState(() => initialProgress(scenario));

  const avatarAnswered =
    scenario.netWorthEstimate !== null ||
    scenario.qualifiedFundsEstimate !== null ||
    scenario.hasDependentsUnder18 !== null;
  const estateAnswered =
    scenario.maritalStatus !== null ||
    Boolean(scenario.stateOfResidence) ||
    scenario.illiquidNetWorth !== null ||
    scenario.estateExceedsExemption !== null ||
    scenario.concentratedLowBasisPosition !== null ||
    scenario.beneficiaryStructure !== null ||
    scenario.controlPreference !== null ||
    scenario.fundingPreference !== null ||
    scenario.existingStructures.length > 0 ||
    scenario.urgencyDriver !== null ||
    scenario.existingPolicyTransfer !== null;

  return (
    <form
      action={action}
      onChange={(event) => setProgress(progressFromForm(event.currentTarget))}
      className="space-y-8"
    >
      <input type="hidden" name="scenarioId" value={scenario.id} />

      <div className="sticky top-0 z-10 -mx-8 -mt-8 rounded-t-lg border-b border-border bg-surface/95 px-8 py-3 backdrop-blur">
        <div className="flex items-center justify-between text-xs text-charcoal/60">
          <span>
            {progress.answered} of {progress.total} questions answered
          </span>
          <span>{progress.answered >= progress.total ? "Ready to save" : "Answer what you know"}</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${Math.round((progress.answered / progress.total) * 100)}%` }}
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          &ldquo;Tell me about this person. What&rsquo;s their situation?&rdquo;
        </legend>
        <textarea
          name="clientDescription"
          rows={3}
          defaultValue={scenario.clientDescription ?? ""}
          className={textInputClass}
          placeholder="One line or a paragraph — however it comes to you"
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">Q1. &ldquo;How old are they?&rdquo;</legend>
        <input
          type="number"
          name="primaryAge"
          min={0}
          max={120}
          defaultValue={scenario.primaryAge ?? ""}
          className={`${textInputClass} w-32`}
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Q2. &ldquo;How&rsquo;s their health &mdash; good, average, or are there any health issues we
          should know about?&rdquo;
        </legend>
        <div className="mt-2 space-y-2">
          {(["good", "average", "health_issues"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="healthRating"
                value={value}
                defaultChecked={scenario.healthRating === value}
                className={radioClass}
              />
              {value === "good" ? "Good" : value === "average" ? "Average" : "Health issues"}
            </label>
          ))}
        </div>
        <input
          type="text"
          name="healthNotes"
          defaultValue={scenario.healthNotes ?? ""}
          placeholder="Any specifics (medications, conditions)"
          className={textInputClass}
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Q3. &ldquo;Tobacco user? Cigarettes, cigars, dip, vape, marijuana &mdash; and how often?&rdquo;
        </legend>
        <div className="mt-2 space-y-2">
          {(["none", "occasional", "regular"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="tobaccoUse"
                value={value}
                defaultChecked={scenario.tobaccoUse === value}
                className={radioClass}
              />
              {value === "none" ? "None" : value === "occasional" ? "Occasional" : "Regular"}
            </label>
          ))}
        </div>
        <input
          type="text"
          name="tobaccoNotes"
          defaultValue={scenario.tobaccoNotes ?? ""}
          placeholder="What, and how often"
          className={textInputClass}
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Q4. &ldquo;Are they a business owner, an employee, or neither?&rdquo;
        </legend>
        <div className="mt-2 space-y-2">
          {(["business_owner", "employee", "neither"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="businessOwnerStatus"
                value={value}
                defaultChecked={scenario.businessOwnerStatus === value}
                onChange={() => setOwnerStatus(value)}
                className={radioClass}
              />
              {value === "business_owner"
                ? "Business owner"
                : value === "employee"
                  ? "Employee"
                  : "Neither"}
            </label>
          ))}
        </div>
        {ownerStatus !== "business_owner" && (
          <p className="mt-2 text-xs text-charcoal/40">
            The business questions (structure, co-owners, key employees) appear here when this is a
            business owner.
          </p>
        )}
      </fieldset>

      {ownerStatus === "business_owner" && (
        <div className="space-y-8 border-l-2 border-gold/40 pl-4">
          <fieldset>
            <legend className="text-sm font-medium text-navy">
              Q5. &ldquo;What&rsquo;s the structure &mdash; C-Corp, S-Corp, partnership, LLC, or sole
              prop?&rdquo;
            </legend>
            <select
              name="businessStructure"
              defaultValue={scenario.businessStructure ?? ""}
              className={textInputClass}
            >
              <option value="">Not applicable / unknown</option>
              <option value="c_corp">C-Corp</option>
              <option value="s_corp">S-Corp</option>
              <option value="partnership">Partnership</option>
              <option value="llc">LLC</option>
              <option value="sole_prop">Sole prop</option>
            </select>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              Q6. &ldquo;Are there co-owners? If so, what are their ages and ownership
              percentages?&rdquo;
            </legend>
            <textarea
              name="coOwnersNotes"
              rows={2}
              defaultValue={scenario.coOwnersNotes ?? ""}
              className={textInputClass}
              placeholder="e.g. 50/50 split, ages 50 and 49"
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              Q7. &ldquo;Are there key employees? How many?&rdquo;
            </legend>
            <input
              type="number"
              name="keyEmployeesCount"
              min={0}
              defaultValue={scenario.keyEmployeesCount ?? ""}
              className={`${textInputClass} w-32`}
            />
            <input
              type="text"
              name="keyEmployeesNotes"
              defaultValue={scenario.keyEmployeesNotes ?? ""}
              placeholder="Ages, tenure, anything relevant"
              className={textInputClass}
            />
          </fieldset>
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Q8. &ldquo;What are they trying to solve for?&rdquo; Select all that apply.
        </legend>
        <div className="mt-2 space-y-2">
          {(
            [
              ["retirement_income", "Retirement income"],
              ["business_continuity", "Business continuity"],
              ["key_employee_retention", "Key employee retention"],
              ["estate_planning", "Estate planning"],
              ["legacy", "Leaving a legacy to family"],
              ["other", "Something else"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="checkbox"
                name="primaryGoals"
                value={value}
                defaultChecked={scenario.primaryGoals.includes(value)}
                className={checkboxClass}
              />
              {label}
            </label>
          ))}
        </div>
        <input
          type="text"
          name="goalsNotes"
          defaultValue={scenario.goalsNotes ?? ""}
          placeholder="Anything else in their own words"
          className={textInputClass}
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Q9. &ldquo;Do you have an existing relationship with them, or is this a new
          prospect?&rdquo;
        </legend>
        <div className="mt-2 space-y-2">
          {(["existing", "new_prospect"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="existingRelationship"
                value={value}
                defaultChecked={scenario.existingRelationship === value}
                className={radioClass}
              />
              {value === "existing" ? "Existing relationship" : "New prospect"}
            </label>
          ))}
        </div>

        <p className="mt-3 text-xs text-charcoal/50">
          Optional — for the pipeline math: which close-rate category is this closest to?
        </p>
        <div className="mt-1 space-y-2">
          {(
            [
              ["existing_strong", "Existing client / strong relationship (40%)"],
              ["existing_first_meeting", "Existing prospect, first meeting (25%)"],
              ["existing_second_meeting", "Existing prospect, second meeting (40%)"],
              ["cold_first_meeting", "Cold lead, first meeting (15%)"],
              ["cold_second_meeting", "Cold lead, second meeting (30%)"],
              ["referral_warm", "Warm referral (35%)"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="relationshipType"
                value={value}
                defaultChecked={scenario.relationshipType === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Q10. &ldquo;Roughly what&rsquo;s their annual income or business revenue?&rdquo;
        </legend>
        <div className="mt-2 space-y-2">
          {(
            [
              ["under_250k", "Under $250K"],
              ["range_250k_1m", "$250K–$1M"],
              ["range_1m_5m", "$1M–$5M"],
              ["over_5m", "Above $5M"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="incomeRevenueRange"
                value={value}
                defaultChecked={scenario.incomeRevenueRange === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <SectionToggle
        id="avatar-details"
        title="Avatar details (net worth, qualified funds, dependents)"
        hint="Worth asking when a strategy hinges on it — qualified funds unlock the QWT / RMD / Roth+Life family, net worth sharpens the avatar."
        defaultOpen={avatarAnswered || focusSection === "avatar"}
      >
        <p className="mt-4 text-sm text-charcoal">Roughly what&rsquo;s their net worth?</p>
        <div className="mt-2 space-y-2">
          {(
            [
              ["under_500k", "Under $500K"],
              ["range_500k_2m", "$500K–$2M"],
              ["range_2m_5m", "$2M–$5M"],
              ["over_5m", "Above $5M"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="netWorthEstimate"
                value={value}
                defaultChecked={scenario.netWorthEstimate === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">
          Do they have $500K+ in qualified funds (IRA, 401(k), etc.)?
        </p>
        <div className="mt-2 space-y-2">
          {(["over_500k", "under_500k"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="qualifiedFundsEstimate"
                value={value}
                defaultChecked={scenario.qualifiedFundsEstimate === value}
                className={radioClass}
              />
              {value === "over_500k" ? "Yes, $500K+" : "No, under $500K"}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">Do they have dependents under 18?</p>
        <div className="mt-2 space-y-2">
          {(["true", "false"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="hasDependentsUnder18"
                value={value}
                defaultChecked={
                  scenario.hasDependentsUnder18 !== null &&
                  String(scenario.hasDependentsUnder18) === value
                }
                className={radioClass}
              />
              {value === "true" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </SectionToggle>

      <SectionToggle
        id="estate-details"
        title="HNW estate-planning details"
        hint="Only needed to check this prospect against the HNW estate-planning strategies (ILIT, SLAT, Dynasty Trust, GRATs, and similar). Most scenarios can skip this."
        defaultOpen={estateAnswered || focusSection === "estate"}
      >
        <p className="mt-4 text-sm text-charcoal">Marital status</p>
        <div className="mt-2 space-y-2">
          {(["married", "single"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="maritalStatus"
                value={value}
                defaultChecked={scenario.maritalStatus === value}
                className={radioClass}
              />
              {value === "married" ? "Married" : "Single"}
            </label>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium text-charcoal">
          State of residence
          <input
            type="text"
            name="stateOfResidence"
            defaultValue={scenario.stateOfResidence ?? ""}
            placeholder="For state estate-tax exposure"
            className={`${textInputClass} w-48`}
          />
        </label>

        <p className="mt-4 text-sm text-charcoal">
          Is their net worth mostly illiquid (real estate, closely held business)?
        </p>
        <div className="mt-2 space-y-2">
          {(["true", "false"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="illiquidNetWorth"
                value={value}
                defaultChecked={
                  scenario.illiquidNetWorth !== null && String(scenario.illiquidNetWorth) === value
                }
                className={radioClass}
              />
              {value === "true" ? "Yes" : "No"}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">
          Does their estate value exceed the federal exemption ($15M single / $30M married in
          2026)?
        </p>
        <div className="mt-2 space-y-2">
          {(["true", "false"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="estateExceedsExemption"
                value={value}
                defaultChecked={
                  scenario.estateExceedsExemption !== null &&
                  String(scenario.estateExceedsExemption) === value
                }
                className={radioClass}
              />
              {value === "true" ? "Yes" : "No"}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">
          Do they hold a concentrated, low-basis appreciated asset (founder stock, appreciated
          real estate)?
        </p>
        <div className="mt-2 space-y-2">
          {(["true", "false"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="concentratedLowBasisPosition"
                value={value}
                defaultChecked={
                  scenario.concentratedLowBasisPosition !== null &&
                  String(scenario.concentratedLowBasisPosition) === value
                }
                className={radioClass}
              />
              {value === "true" ? "Yes" : "No"}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">Who&rsquo;s the intended beneficiary structure?</p>
        <div className="mt-2 space-y-2">
          {(
            [
              ["spouse_only", "Spouse only"],
              ["children", "Children"],
              ["grandchildren_multigenerational", "Grandchildren / multi-generational"],
              ["charity", "Charity"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="beneficiaryStructure"
                value={value}
                defaultChecked={scenario.beneficiaryStructure === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">Control preference</p>
        <div className="mt-2 space-y-2">
          {(
            [
              ["relinquish_control", "Willing to fully relinquish control (outright gift)"],
              ["retained_access_or_control", "Wants retained access or control"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="controlPreference"
                value={value}
                defaultChecked={scenario.controlPreference === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">Funding preference</p>
        <div className="mt-2 space-y-2">
          {(
            [
              ["gift_or_exemption", "Willing to gift / use exemption"],
              ["financing_or_loan", "Prefers financing / loan structures"],
              ["employer_funded", "Wants employer-funded (executive benefit)"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="fundingPreference"
                value={value}
                defaultChecked={scenario.fundingPreference === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">Existing structures already in place</p>
        <div className="mt-2 space-y-2">
          {(
            [
              ["ilit", "ILIT"],
              ["grantor_trust", "Grantor trust"],
              ["qualified_plan", "Qualified plan"],
              ["business_entity", "Business entity"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="checkbox"
                name="existingStructures"
                value={value}
                defaultChecked={scenario.existingStructures.includes(value)}
                className={checkboxClass}
              />
              {label}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">Urgency driver</p>
        <div className="mt-2 space-y-2">
          {(
            [
              ["legislative_exemption_sunset", "Legislative / exemption-sunset concern"],
              ["liquidity_event", "Liquidity event"],
              ["health_change", "Health change"],
              ["business_sale", "Business sale"],
              ["generational_transfer_event", "Generational transfer event"],
              ["none", "None / not urgent"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="urgencyDriver"
                value={value}
                defaultChecked={scenario.urgencyDriver === value}
                className={radioClass}
              />
              {label}
            </label>
          ))}
        </div>

        <p className="mt-4 text-sm text-charcoal">
          If an ILIT is in play, is the policy being transferred in from an existing policy
          (rather than newly issued with the ILIT as original owner)?
        </p>
        <p className="text-xs text-charcoal/50">
          CLAUDE.md hard rule 4: the ILIT must be the original owner to avoid the §2035 3-year
          lookback.
        </p>
        <div className="mt-2 space-y-2">
          {(["true", "false"] as const).map((value) => (
            <label key={value} className={optionLabelClass}>
              <input
                type="radio"
                name="existingPolicyTransfer"
                value={value}
                defaultChecked={
                  scenario.existingPolicyTransfer !== null &&
                  String(scenario.existingPolicyTransfer) === value
                }
                className={radioClass}
              />
              {value === "true" ? "Yes, transferring an existing policy" : "No, new-issue"}
            </label>
          ))}
        </div>
      </SectionToggle>

      <SectionToggle
        id="case-numbers"
        title="Case numbers — agent-only math"
        hint="Rough figures for the quantified improvement analysis (current path vs. with the strategy, 2026 federal tables). Never shown to clients — the pitch deck stays structural by design."
        defaultOpen={
          scenario.estimatedEstateValue !== null ||
          scenario.estimatedQualifiedBalance !== null ||
          scenario.estimatedTaxableIncome !== null ||
          focusSection === "numbers"
        }
      >
        {(
          [
            ["estimatedEstateValue", "Estimated estate value", "Drives the estate-tax exposure math"],
            [
              "estimatedQualifiedBalance",
              "Estimated qualified balance (IRA/401(k))",
              "Drives the 10-year-rule and repositioning math",
            ],
            [
              "estimatedTaxableIncome",
              "Estimated taxable income (household)",
              "Drives bracket, conversion, and AMT-trap math",
            ],
          ] as const
        ).map(([name, label, hint]) => (
          <label key={name} className="mt-4 block text-sm font-medium text-charcoal">
            {label}
            <input
              type="number"
              name={name}
              min={0}
              defaultValue={scenario[name] ?? ""}
              placeholder="$"
              className={`${textInputClass} w-48`}
            />
            <span className="mt-0.5 block text-xs font-normal text-charcoal/50">{hint}</span>
          </label>
        ))}
      </SectionToggle>

      <div className={cn("flex items-center gap-4 border-t border-border pt-6")}>
        <SubmitButton pendingText="Saving…">Save intake answers</SubmitButton>
        <span className="text-xs text-charcoal/50">
          Atlas builds the case design the moment you save.
        </span>
      </div>
    </form>
  );
}
