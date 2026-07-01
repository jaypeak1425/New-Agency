import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getScenarioForUser, ScenarioError } from "@/lib/scenarios";
import { completeIntakeAction } from "../../actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";

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
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
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

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
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

          <div className="flex items-center gap-4 pt-2">
            <SubmitButton pendingText="Saving…">Save intake answers</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
