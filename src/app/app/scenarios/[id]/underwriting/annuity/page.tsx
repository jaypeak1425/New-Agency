import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getScenarioForUser, ScenarioError } from "@/lib/scenarios";
import { getAnnuityIntake } from "@/lib/underwriting";
import { completeAnnuityIntakeAction } from "../../../actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";

const radioClass = "h-4 w-4 border-border text-navy focus:ring-gold";
const optionLabelClass = "flex items-center gap-2 text-sm text-charcoal";
const textInputClass =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default async function AnnuityIntakePage({
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
  const intake = await getAnnuityIntake(user.id, id);

  return (
    <div>
      <Link href={`/app/scenarios/${id}/intake`} className="text-sm text-navy hover:text-gold">
        &larr; Back to intake
      </Link>
      <h1 className="mt-4 text-3xl">Annuity intake</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        {scenario.label} &mdash; financially underwritten, no medical questions. Age reuses the
        answer from the main intake. Note: none of the annuity-side strategies (Quiet Wealth
        Transfer, Annuity Rescue, Qualified LTC) are documented in the strategy library yet, so
        this data won&rsquo;t drive a recommendation until that content lands — it&rsquo;s
        collected here so it&rsquo;s ready when it does.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="mt-6 max-w-2xl">
        <form action={completeAnnuityIntakeAction} className="space-y-8">
          <input type="hidden" name="scenarioId" value={scenario.id} />

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;What&rsquo;s their total liquid net worth?&rdquo;
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
                    name="liquidNetWorthRange"
                    value={value}
                    defaultChecked={intake?.liquidNetWorthRange === value}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Where would the money come from — qualified or non-qualified?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["qualified", "Qualified (IRA, 401(k), 403(b))"],
                  ["non_qualified", "Non-qualified (savings, brokerage, inheritance)"],
                  ["mixed", "Mixed"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="sourceOfFunds"
                    value={value}
                    defaultChecked={intake?.sourceOfFunds === value}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;How much are they thinking about putting in?&rdquo;
            </legend>
            <input
              type="number"
              name="allocationAmount"
              min={0}
              step={1000}
              defaultValue={intake?.allocationAmount ?? ""}
              className={`${textInputClass} w-48`}
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;When do they want the income to start?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["immediately", "Immediately"],
                  ["deferred_5_years", "In 5 years"],
                  ["deferred_to_retirement_age", "At retirement age (65/70)"],
                  ["deferred_accumulation", "Not yet — just growth for now"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="desiredIncomeStartDate"
                    value={value}
                    defaultChecked={intake?.desiredIncomeStartDate === value}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Do they have any existing annuity contracts? If so, what type and with which
              carrier?&rdquo;
            </legend>
            <textarea
              name="existingAnnuityContractsNotes"
              rows={2}
              defaultValue={intake?.existingAnnuityContractsNotes ?? ""}
              className={textInputClass}
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Roughly what tax bracket are they in?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["under_22", "Under 22%"],
                  ["range_22_32", "22–32%"],
                  ["range_32_37", "32–37%"],
                  ["above_37", "Above 37%"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="taxBracket"
                    value={value}
                    defaultChecked={intake?.taxBracket === value}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;Is the goal to leave a legacy to heirs, or just income for themselves?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["legacy", "Legacy for heirs"],
                  ["income_only", "Income for themselves only"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="estatePlanningIntent"
                    value={value}
                    defaultChecked={intake?.estatePlanningIntent === value}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              &ldquo;How important is it that they can access the full amount without penalty in
              the next 5-7 years?&rdquo;
            </legend>
            <div className="mt-2 space-y-2">
              {(["true", "false"] as const).map((value) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="needsLiquidityWithin5to7Years"
                    value={value}
                    defaultChecked={
                      intake?.needsLiquidityWithin5to7Years !== null &&
                      intake?.needsLiquidityWithin5to7Years !== undefined &&
                      String(intake.needsLiquidityWithin5to7Years) === value
                    }
                    className={radioClass}
                  />
                  {value === "true" ? "Yes, needs access" : "No, can commit long-term"}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-4 pt-2">
            <SubmitButton pendingText="Saving…">Save annuity intake</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
