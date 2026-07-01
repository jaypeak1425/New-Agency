import { getCurrentUser } from "@/lib/auth";
import { getAgentProfile } from "@/lib/onboarding";
import { computeBookOfBusinessOpportunity } from "@/lib/book-of-business";
import { updateBookOfBusinessAction } from "./actions";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";

const inputClass =
  "mt-1 block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const agentProfile = user ? await getAgentProfile(user.id) : null;
  const opportunity = computeBookOfBusinessOpportunity(agentProfile);

  return (
    <div>
      <h1 className="text-3xl">Settings</h1>
      <Card className="mt-6 max-w-xl">
        <p className="text-sm text-charcoal">
          Email: <span className="font-medium">{user?.email}</span>
        </p>
        <p className="mt-3 text-sm text-charcoal/70">
          Output preferences, voice-vs-type, and reminder settings ship in Phase 2/3 onboarding.
        </p>
      </Card>

      <Card className="mt-6 max-w-xl">
        <h2 className="text-lg font-medium text-navy">Book of business</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          docs/07-progress-dashboard-math.md section 4 — self-reported client counts by avatar,
          updated quarterly. This drives the &ldquo;unmined gold&rdquo; number on your dashboard.
        </p>

        <form action={updateBookOfBusinessAction} className="mt-4 space-y-4">
          {(
            [
              ["businessOwnersWithCoOwnersCount", "Business owners with co-owners"],
              ["businessOwnersSoloCount", "Business owners, solo"],
              ["hnwIndividualsCount", "HNW individuals"],
              ["qualifiedFundHeavyCount", "Qualified fund heavy"],
              ["familyLegacyCount", "Family / Legacy"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="block text-sm font-medium text-charcoal">
              {label}
              <input
                type="number"
                name={name}
                min={0}
                defaultValue={agentProfile?.[name] ?? ""}
                className={inputClass}
              />
            </label>
          ))}

          <label className="block text-sm font-medium text-charcoal">
            Addressable filter override (%, default 15%)
            <input
              type="number"
              name="bookAddressableFilterOverridePercent"
              min={0}
              max={100}
              defaultValue={
                agentProfile?.bookAddressableFilterOverridePercent
                  ? Math.round(agentProfile.bookAddressableFilterOverridePercent * 100)
                  : ""
              }
              className={inputClass}
            />
          </label>

          <SubmitButton pendingText="Saving…">Save book of business</SubmitButton>
        </form>

        {opportunity && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm text-navy">
              Total book opportunity (Y1): ${opportunity.totalOpportunity.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-navy">
              Addressable in next 12 months ({Math.round(opportunity.addressableFilterPercent * 100)}
              %): ${opportunity.addressableOpportunity.toLocaleString()}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
