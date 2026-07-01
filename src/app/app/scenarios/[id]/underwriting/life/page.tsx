import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getScenarioForUser, ScenarioError } from "@/lib/scenarios";
import { getLifeUnderwritingIntake } from "@/lib/underwriting";
import { completeLifeUnderwritingAction } from "../../../actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";

const radioClass = "h-4 w-4 border-border text-navy focus:ring-gold";
const checkboxClass = "h-4 w-4 rounded border-border text-navy focus:ring-gold";
const optionLabelClass = "flex items-center gap-2 text-sm text-charcoal";
const textInputClass =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default async function LifeUnderwritingPage({
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
  const intake = await getLifeUnderwritingIntake(user.id, id);

  return (
    <div>
      <Link href={`/app/scenarios/${id}/intake`} className="text-sm text-navy hover:text-gold">
        &larr; Back to intake
      </Link>
      <h1 className="mt-4 text-3xl">Life insurance underwriting</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        {scenario.label} &mdash; fully underwritten. Age and tobacco use are already captured on
        the main intake; this fills in the rest of docs/04-field-underwriting.md&rsquo;s 12
        questions.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="mt-6 max-w-2xl">
        <form action={completeLifeUnderwritingAction} className="space-y-8">
          <input type="hidden" name="scenarioId" value={scenario.id} />

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;How tall are they and what do they weigh?&rdquo;
            </legend>
            <div className="mt-2 flex gap-4">
              <label className="text-sm text-charcoal">
                Height (inches)
                <input
                  type="number"
                  name="heightInches"
                  min={36}
                  max={96}
                  defaultValue={intake?.heightInches ?? ""}
                  className={`${textInputClass} w-28`}
                />
              </label>
              <label className="text-sm text-charcoal">
                Weight (lbs)
                <input
                  type="number"
                  name="weightLbs"
                  min={50}
                  max={600}
                  defaultValue={intake?.weightLbs ?? ""}
                  className={`${textInputClass} w-28`}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Any major diagnoses in the last 10 years?&rdquo; Select all that apply.
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["heart_attack_or_stroke", "Heart attack or stroke"],
                  ["cancer", "Cancer"],
                  ["diabetes_type_1", "Diabetes (Type 1)"],
                  ["diabetes_type_2_controlled", "Diabetes (Type 2, well-controlled)"],
                  ["autoimmune", "Autoimmune (lupus, RA, MS)"],
                  ["mental_health_hospitalization", "Mental health hospitalization"],
                  ["none", "None of the above"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="checkbox"
                    name="majorDiagnoses"
                    value={value}
                    defaultChecked={intake?.majorDiagnoses.includes(value)}
                    className={checkboxClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Any hospitalizations or surgeries in the last 5 years?&rdquo;
            </legend>
            <textarea
              name="hospitalizationsOrSurgeriesNotes"
              rows={2}
              defaultValue={intake?.hospitalizationsOrSurgeriesNotes ?? ""}
              className={textInputClass}
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Did any parent or sibling die before age 60 from heart disease, cancer, or
              stroke?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(["true", "false"] as const).map((value) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="familyHistoryEarlyDeath"
                    value={value}
                    defaultChecked={
                      intake?.familyHistoryEarlyDeath !== null &&
                      intake?.familyHistoryEarlyDeath !== undefined &&
                      String(intake.familyHistoryEarlyDeath) === value
                    }
                    className={radioClass}
                  />
                  {value === "true" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;What do they do for a living?&rdquo;
            </legend>
            <input
              type="text"
              name="occupation"
              defaultValue={intake?.occupation ?? ""}
              className={textInputClass}
            />
            <p className="mt-2 text-sm text-charcoal">Is it a hazardous occupation?</p>
            <div className="mt-2 space-y-2">
              {(["true", "false"] as const).map((value) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="hazardousOccupation"
                    value={value}
                    defaultChecked={
                      intake?.hazardousOccupation !== null &&
                      intake?.hazardousOccupation !== undefined &&
                      String(intake.hazardousOccupation) === value
                    }
                    className={radioClass}
                  />
                  {value === "true" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Any hobbies that involve risk? Aviation, racing, scuba, climbing, skydiving,
              hang gliding?&rdquo;
            </legend>
            <input
              type="text"
              name="hobbies"
              defaultValue={intake?.hobbies ?? ""}
              className={textInputClass}
            />
            <p className="mt-2 text-sm text-charcoal">Is it a hazardous hobby?</p>
            <div className="mt-2 space-y-2">
              {(["true", "false"] as const).map((value) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="hazardousHobby"
                    value={value}
                    defaultChecked={
                      intake?.hazardousHobby !== null &&
                      intake?.hazardousHobby !== undefined &&
                      String(intake.hazardousHobby) === value
                    }
                    className={radioClass}
                  />
                  {value === "true" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Any DUI or reckless driving in the last 5 years? Any moving
              violations?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["none", "None"],
                  ["single_5_plus_years_ago", "Single DUI, 5+ years ago"],
                  ["within_3_years", "DUI within the last 3 years"],
                  ["multiple", "Multiple DUIs"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="duiHistory"
                    value={value}
                    defaultChecked={intake?.duiHistory === value}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Any foreign travel planned in the next 12 months? If so, where?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(["true", "false"] as const).map((value) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="foreignTravelPlanned"
                    value={value}
                    defaultChecked={
                      intake?.foreignTravelPlanned !== null &&
                      intake?.foreignTravelPlanned !== undefined &&
                      String(intake.foreignTravelPlanned) === value
                    }
                    className={radioClass}
                  />
                  {value === "true" ? "Yes" : "No"}
                </label>
              ))}
            </div>
            <input
              type="text"
              name="foreignTravelNotes"
              defaultValue={intake?.foreignTravelNotes ?? ""}
              placeholder="Where"
              className={textInputClass}
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Do they have any life insurance in force right now? With which carriers? Any
              rated policies?&rdquo;
            </legend>
            <textarea
              name="existingLifeInsuranceNotes"
              rows={2}
              defaultValue={intake?.existingLifeInsuranceNotes ?? ""}
              className={textInputClass}
            />
          </fieldset>

          <div className="flex items-center gap-4 pt-2">
            <SubmitButton pendingText="Saving…">Save underwriting answers</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
