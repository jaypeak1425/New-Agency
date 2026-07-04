import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Wordmark } from "@/components/ui/Wordmark";
import { SubmitButton } from "@/components/SubmitButton";
import { completeOnboardingAction, skipOnboardingAction } from "./actions";

const radioClass = "h-4 w-4 border-border text-navy focus:ring-gold";
const checkboxClass = "h-4 w-4 rounded border-border text-navy focus:ring-gold";
const optionLabelClass = "flex items-center gap-2 text-sm text-charcoal";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "wholesaler") redirect("/wholesaler");
  if (user.role === "imo_principal") redirect("/imo-principal");

  return (
    <main className="flex min-h-full flex-col items-center bg-cream px-6 py-16">
      <div className="mb-8">
        <Wordmark />
      </div>
      <Card className="w-full max-w-2xl">
        <h1 className="text-2xl">Let&rsquo;s set up Case Atlas for how you actually work.</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          A few quick questions. This tunes the recommendations, the COI scripts, and the output
          format Atlas hands you — the 25-year veteran and the 3-year producer get different
          experiences from here.
        </p>

        <form action={completeOnboardingAction} className="mt-8 space-y-8">
          <fieldset>
            <legend className="text-sm font-medium text-navy">
              How long have you been in the business?
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["under_1yr", "Less than 1 year"],
                ["yr_1_3", "1–3 years"],
                ["yr_3_5", "3–5 years"],
                ["yr_5_10", "5–10 years"],
                ["yr_10_plus", "10+ years"],
              ].map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input type="radio" name="tenureBand" value={value} required className={radioClass} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              What&rsquo;s your average annual income right now?
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["under_50k", "Under $50K"],
                ["band_50k_100k", "$50K–$100K"],
                ["band_100k_250k", "$100K–$250K"],
                ["band_250k_500k", "$250K–$500K"],
                ["over_500k", "$500K+"],
              ].map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="currentIncomeBand"
                    value={value}
                    required
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              What&rsquo;s your income goal? <span className="font-normal text-charcoal/50">(optional)</span>
            </legend>
            <input
              type="number"
              name="goalIncome"
              min={0}
              step={1000}
              placeholder="e.g. 500000"
              className="mt-2 w-48 rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              Which clients make up your book? Select all that apply.
            </legend>
            <div className="mt-2 space-y-2">
              {[
                ["high_net_worth", "High net worth families ($2M+ net worth)"],
                ["business_owner", "Business owners with employees"],
                ["qualified_fund_heavy", "Clients with large IRAs/401(k)s ($500K+)"],
                ["family_legacy", "Families focused on legacy or protection"],
              ].map(([value, label]) => (
                <label key={value} className={optionLabelClass}>
                  <input type="checkbox" name="avatarMix" value={value} className={checkboxClass} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              How do you want to work with Atlas?
            </legend>
            <div className="mt-2 space-y-2">
              <label className={optionLabelClass}>
                <input
                  type="radio"
                  name="interactionPreference"
                  value="type"
                  defaultChecked
                  className={radioClass}
                />
                I&rsquo;ll type my scenarios
              </label>
              <label className={optionLabelClass}>
                <input
                  type="radio"
                  name="interactionPreference"
                  value="voice"
                  className={radioClass}
                />
                I&rsquo;d rather talk them through (voice input, coming in a later phase)
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              How do you want your output?
            </legend>
            <div className="mt-2 space-y-2">
              {[
                ["pdf", "A PDF I can email"],
                ["slide_deck", "A slide deck for the meeting"],
                ["one_pager", "A one-pager, keep it simple"],
              ].map(([value, label], i) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="outputPreference"
                    value={value}
                    defaultChecked={i === 0}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">
              How often should we nudge you about your pipeline?
            </legend>
            <div className="mt-2 space-y-2">
              {[
                ["weekly", "Weekly"],
                ["daily", "Daily"],
                ["none", "Don't remind me"],
              ].map(([value, label], i) => (
                <label key={value} className={optionLabelClass}>
                  <input
                    type="radio"
                    name="reminderFrequency"
                    value={value}
                    defaultChecked={i === 0}
                    className={radioClass}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-navy">Your COI relationships</legend>
            <div className="mt-2 space-y-2">
              <label className={optionLabelClass}>
                <input type="checkbox" name="hasCpaRelationship" className={checkboxClass} />
                I have a CPA I can bring into a case
              </label>
              <label className={optionLabelClass}>
                <input type="checkbox" name="hasAttorneyRelationship" className={checkboxClass} />
                I have an attorney I can bring into a case
              </label>
            </div>
            <input
              type="text"
              name="imoAffiliation"
              placeholder="IMO/FMO/BGA affiliation (optional)"
              className="mt-3 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </fieldset>

          <div className="flex items-center gap-4 pt-2">
            <SubmitButton pendingText="Saving…">Save and go to dashboard</SubmitButton>
          </div>
        </form>

        <form action={skipOnboardingAction} className="mt-4">
          <button type="submit" className="text-sm text-charcoal/60 hover:text-navy">
            Skip for now
          </button>
        </form>
      </Card>
    </main>
  );
}
