import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getScenarioForUser, ScenarioError } from "@/lib/scenarios";
import { classifyAvatars } from "@/lib/avatars";
import { recommendStrategies } from "@/lib/recommendations";
import { getLifeUnderwritingIntake } from "@/lib/underwriting";
import { buildHandoffPreview } from "@/lib/wholesaler";
import { computeExpectedCommission, computeExpectedCommissionValue } from "@/lib/commission";
import { isAiConfigured } from "@/lib/ai";
import {
  completeIntakeAction,
  notifyWholesalerAction,
  parseIntakeAction,
  saveStrategyEstimateAction,
} from "../../actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";
import type { Scenario, User } from "@/generated/prisma/client";

const AVATAR_LABELS: Record<string, string> = {
  business_owner: "Business Owner",
  high_net_worth: "High Net Worth",
  qualified_fund_heavy: "Qualified Fund Heavy",
  family_legacy: "Family / Legacy",
};

const radioClass = "h-4 w-4 border-border text-navy focus:ring-gold";
const checkboxClass = "h-4 w-4 rounded border-border text-navy focus:ring-gold";
const optionLabelClass = "flex items-center gap-2 text-sm text-charcoal";
const textInputClass =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; parsed?: string }>;
}) {
  const { id } = await params;
  const { error, parsed } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let scenario;
  try {
    scenario = await getScenarioForUser(user.id, id);
  } catch (err) {
    if (err instanceof ScenarioError) redirect("/app/scenarios");
    throw err;
  }

  return (
    <div>
      <Link href="/app/scenarios" className="text-sm text-navy hover:text-gold">
        &larr; Back to scenarios
      </Link>
      <h1 className="mt-4 text-3xl">&ldquo;I&rsquo;ve got a guy&rdquo; intake</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        {scenario.label} &mdash; walk through Atlas&rsquo;s 10 questions. Answer what you know;
        you can come back and fill in the rest later.
      </p>
      <p className="mt-2 text-sm">
        <Link href={`/app/scenarios/${id}/underwriting/life`} className="text-navy hover:text-gold">
          Life insurance underwriting &rarr;
        </Link>
        <span className="mx-2 text-charcoal/30">&middot;</span>
        <Link href={`/app/scenarios/${id}/underwriting/annuity`} className="text-navy hover:text-gold">
          Annuity intake &rarr;
        </Link>
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {parsed && (
        <div className="mt-4 max-w-2xl rounded-lg border border-gold/40 bg-gradient-to-r from-gold/15 to-gold/5 px-4 py-3">
          <p className="text-sm text-navy">
            Atlas filled in <span className="font-semibold">{parsed}</span> field(s) from your
            description. Review them below, answer what it couldn&rsquo;t extract, then save.
          </p>
        </div>
      )}

      {isAiConfigured() ? (
        <Card variant="dark" className="mt-6 max-w-2xl">
          <p className="text-xs uppercase tracking-wide text-gold">Tell Atlas</p>
          <p className="mt-2 text-sm text-cream/80">
            Describe the client in your own words — Atlas extracts what it can into the questions
            below, and only ever fills in what you actually said. You review everything before
            saving.
          </p>
          <form action={parseIntakeAction} className="mt-4 space-y-3">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <textarea
              name="description"
              rows={4}
              required
              defaultValue={scenario.clientDescription ?? ""}
              placeholder="I've got a guy. Two owners, 50 and 49, C-Corp, two key employees, average to good health. Want to set up a buy-sell and put money aside in a company reserve."
              className="block w-full rounded-md border border-cream/20 bg-navy px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <SubmitButton pendingText="Atlas is reading…">Have Atlas fill in the intake</SubmitButton>
          </form>
        </Card>
      ) : (
        <p className="mt-4 max-w-2xl text-xs text-charcoal/50">
          Free-text intake (&ldquo;type a paragraph, Atlas fills in the questions&rdquo;) activates
          once the AI backend is configured — an admin can check Launch readiness for the one
          variable it needs.
        </p>
      )}

      <Card className="mt-6 max-w-2xl">
        <form action={completeIntakeAction} className="space-y-8">
          <input type="hidden" name="scenarioId" value={scenario.id} />

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
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              Q5. If they own a business: &ldquo;What&rsquo;s the structure &mdash; C-Corp, S-Corp,
              partnership, LLC, or sole prop?&rdquo;
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
              Q6. If business owner: &ldquo;Are there co-owners? If so, what are their ages and
              ownership percentages?&rdquo;
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
              Q7. If business owner: &ldquo;Are there key employees? How many?&rdquo;
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

          <fieldset className="border-t border-border pt-6">
            <legend className="text-sm font-medium text-navy">
              Optional — helps Atlas classify the avatar stack
            </legend>
            <p className="mt-1 text-xs text-charcoal/50">
              Not one of the 10 fixed questions, but worth asking when a strategy hinges on it
              (e.g. &ldquo;Worth asking if they have IRAs or 401(k)s with significant
              balances&rdquo;).
            </p>

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
          </fieldset>

          <fieldset className="border-t border-border pt-6">
            <legend className="text-sm font-medium text-navy">
              Optional — HNW estate-planning details
            </legend>
            <p className="mt-1 text-xs text-charcoal/50">
              Only needed to check this prospect against the HNW estate-planning strategies (ILIT,
              SLAT, Dynasty Trust, and similar). Most scenarios can skip this section.
            </p>

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
          </fieldset>

          <div className="flex items-center gap-4 pt-2">
            <SubmitButton pendingText="Saving…">Save intake answers</SubmitButton>
          </div>
        </form>
      </Card>

      {scenario.intakeCompletedAt && <AvatarClassificationCard scenario={scenario} />}
      {scenario.intakeCompletedAt && <RecommendationCard scenario={scenario} />}
      {scenario.intakeCompletedAt && Boolean(user.assignedWholesalerId) && (
        <HandoffPreviewCard user={user} scenario={scenario} />
      )}
    </div>
  );
}

function AvatarClassificationCard({
  scenario,
}: {
  scenario: Parameters<typeof classifyAvatars>[0];
}) {
  const classification = classifyAvatars(scenario);

  return (
    <Card className="mt-6 max-w-2xl">
      <h2 className="text-lg font-medium text-navy">Avatar classification</h2>
      {classification.activated.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/70">
          No avatar activated yet from the answers given.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {classification.activated.map((avatar) => (
            <span
              key={avatar}
              className="inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-navy"
            >
              {AVATAR_LABELS[avatar]}
            </span>
          ))}
        </div>
      )}
      {classification.needsMoreInfo.length > 0 && (
        <p className="mt-3 text-xs text-charcoal/50">
          Need more info to rule in or out: {classification.needsMoreInfo.map((a) => AVATAR_LABELS[a]).join(", ")}.
        </p>
      )}
      {classification.amtTrapFlag && (
        <p className="mt-3 rounded-md bg-cream px-3 py-2 text-xs text-charcoal/70">
          {classification.amtTrapNote}
        </p>
      )}
    </Card>
  );
}

async function RecommendationCard({ scenario }: { scenario: Scenario }) {
  const lifeUnderwritingIntake = await getLifeUnderwritingIntake(scenario.userId, scenario.id);
  const { pivot, recommendations, healthConcernNote } = await recommendStrategies(
    scenario,
    lifeUnderwritingIntake,
  );
  const eligible = recommendations.filter((r) => r.eligibility === "eligible");
  const needsMoreInfo = recommendations.filter((r) => r.eligibility === "needs_more_info");
  const commission = pivot.triggered
    ? null
    : await computeExpectedCommission(scenario.userId, scenario.id);
  const estimateBySlug = new Map(commission?.lines.map((l) => [l.strategy.id, l]) ?? []);
  const pipelineValue = pivot.triggered
    ? null
    : await computeExpectedCommissionValue(scenario.userId, scenario);

  return (
    <Card className="mt-6 max-w-2xl">
      <h2 className="text-lg font-medium text-navy">Strategy recommendation</h2>
      <p className="mt-1 text-xs text-charcoal/50">
        Drawn only from the locked, documented strategy library — never invented.
      </p>

      {pivot.triggered ? (
        <p className="mt-3 rounded-md bg-cream px-3 py-2 text-sm text-charcoal/80">{pivot.message}</p>
      ) : (
        <>
          {healthConcernNote && (
            <p className="mt-3 rounded-md bg-cream px-3 py-2 text-xs text-charcoal/70">
              {healthConcernNote}
            </p>
          )}

          {eligible.length === 0 ? (
            <p className="mt-3 text-sm text-charcoal/70">
              Based on what you&rsquo;ve told me, none of the standard strategies are a clean fit
              yet. Fill in more of the optional sections above to narrow this down.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {eligible.map(({ strategy, hardRuleViolations }) => {
                const existingEstimate = estimateBySlug.get(strategy.id);
                return (
                  <li key={strategy.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium text-navy">{strategy.name}</p>
                    {strategy.whyUsed && (
                      <p className="mt-1 text-xs text-charcoal/70">{strategy.whyUsed}</p>
                    )}
                    {hardRuleViolations.length > 0 && (
                      <div className="mt-2 rounded-md bg-red-50 px-2 py-1.5">
                        {hardRuleViolations.map((v) => (
                          <p key={v.rule} className="text-xs text-red-700">
                            <span className="font-medium">Hard rule {v.rule}:</span> {v.message}
                            {v.suggestion && ` ${v.suggestion}`}
                          </p>
                        ))}
                      </div>
                    )}

                    <form
                      action={saveStrategyEstimateAction}
                      className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3"
                    >
                      <input type="hidden" name="scenarioId" value={scenario.id} />
                      <input type="hidden" name="strategyId" value={strategy.id} />
                      <label className="text-xs text-charcoal">
                        Product type
                        <select
                          name="productType"
                          defaultValue={existingEstimate?.estimate.productType ?? ""}
                          className="mt-1 block rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        >
                          <option value="">Select</option>
                          <option value="permanent_life">Permanent life</option>
                          <option value="term_life">Term life</option>
                          <option value="survivorship_life">Survivorship life</option>
                          <option value="annuity">Annuity</option>
                          <option value="coli_face_amount">COLI (face amount)</option>
                          <option value="executive_bonus_162">§162 executive bonus</option>
                          <option value="disability_income">Disability income</option>
                          <option value="ltc_hybrid">LTC / hybrid</option>
                        </select>
                      </label>
                      <label className="text-xs text-charcoal">
                        Annual premium
                        <input
                          type="number"
                          name="annualPremium"
                          min={0}
                          defaultValue={existingEstimate?.estimate.annualPremium ?? ""}
                          className="mt-1 block w-28 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        />
                      </label>
                      <label className="text-xs text-charcoal">
                        Face amount (COLI)
                        <input
                          type="number"
                          name="faceAmount"
                          min={0}
                          defaultValue={existingEstimate?.estimate.faceAmount ?? ""}
                          className="mt-1 block w-28 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        />
                      </label>
                      <SubmitButton variant="outline" pendingText="Saving…" className="px-3 py-1 text-xs">
                        Save estimate
                      </SubmitButton>
                      {existingEstimate && (
                        <span className="text-xs text-charcoal/60">
                          Est. commission: ${existingEstimate.amount.toLocaleString()} (
                          {Math.round(existingEstimate.rate * 1000) / 10}%)
                        </span>
                      )}
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          {commission && commission.lines.length > 0 && (
            <p className="mt-3 rounded-md bg-cream px-3 py-2 text-sm text-navy">
              Total expected commission Y1: ${commission.total.toLocaleString()}
              {commission.overridePercent !== null && (
                <span className="ml-1 text-xs text-charcoal/60">
                  (using your {Math.round(commission.overridePercent * 1000) / 10}% override rate)
                </span>
              )}
              {pipelineValue?.expectedCommissionValue !== null &&
                pipelineValue?.expectedCommissionValue !== undefined && (
                  <span className="mt-1 block text-xs text-charcoal/70">
                    Expected commission value (× {Math.round((pipelineValue.closeRate ?? 0) * 1000) / 10}%
                    close rate): ${pipelineValue.expectedCommissionValue.toLocaleString()}
                  </span>
                )}
              {commission.total > 0 && pipelineValue?.expectedCommissionValue === null && (
                <span className="mt-1 block text-xs text-charcoal/50">
                  Set the close-rate category above (near Q9) to see the pipeline value.
                </span>
              )}
            </p>
          )}

          {needsMoreInfo.length > 0 && (
            <p className="mt-3 text-xs text-charcoal/50">
              Could also fit, pending more info: {needsMoreInfo.map((r) => r.strategy.name).join(", ")}.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

async function HandoffPreviewCard({ user, scenario }: { user: User; scenario: Scenario }) {
  const preview = await buildHandoffPreview(user, scenario.id);

  return (
    <Card className="mt-6 max-w-2xl">
      <h2 className="text-lg font-medium text-navy">Wholesaler handoff</h2>
      <p className="mt-1 text-xs text-charcoal/50">
        docs/06-wholesaler-handoff.md: fires once all the eligibility gates pass. Review before
        sending — Atlas never auto-sends.
      </p>

      {!preview.ready ? (
        <p className="mt-3 text-sm text-charcoal/70">{preview.reason}</p>
      ) : (
        <>
          <div className="mt-3 space-y-3 text-sm text-charcoal/80">
            <div>
              <p className="font-medium text-navy">Strategy requested</p>
              {preview.content.strategyRequestedLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div>
              <p className="font-medium text-navy">Client profile</p>
              {preview.content.clientProfileLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {preview.content.businessContextLines.length > 0 && (
              <div>
                <p className="font-medium text-navy">Business context</p>
                {preview.content.businessContextLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            <div>
              <p className="font-medium text-navy">Scenario summary</p>
              {preview.content.scenarioSummaryLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {preview.content.coiNotes.length > 0 && (
              <div>
                <p className="font-medium text-navy">COI notes</p>
                {preview.content.coiNotes.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            <p className="text-xs text-charcoal/50">{preview.content.complianceNote}</p>
          </div>

          <form action={notifyWholesalerAction} className="mt-4">
            <input type="hidden" name="scenarioId" value={scenario.id} />
            <SubmitButton pendingText="Sending…">
              {scenario.wholesalerNotifiedAt ? "Send again" : "Send to wholesaler"}
            </SubmitButton>
          </form>
        </>
      )}
    </Card>
  );
}
