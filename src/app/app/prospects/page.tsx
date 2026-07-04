import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { rankProspects, getOrCreateWeeklyCallQueue } from "@/lib/prospecting";
import { getTopBookOpportunities } from "@/lib/book-import";
import { startCaseFromBookAction } from "@/app/app/book/actions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";
import { SCENARIO_STATUS_LABELS as STATUS_LABELS } from "@/components/ScenarioStatusBadge";

const AVATAR_LABELS: Record<string, string> = {
  business_owner: "Business Owner",
  high_net_worth: "High Net Worth",
  qualified_fund_heavy: "Qualified Fund Heavy",
  family_legacy: "Family / Legacy",
};

function money(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export default async function ProspectsPage() {
  const user = await getCurrentUser();
  const [prospects, callQueue, bookOpportunities] = await Promise.all([
    rankProspects(user!.id),
    getOrCreateWeeklyCallQueue(user!.id),
    getTopBookOpportunities(user!.id),
  ]);

  if (prospects.length === 0 && bookOpportunities.length === 0) {
    return (
      <EmptyState
        title="Prospects"
        body="No prospects yet. Run an “I've got a guy” intake from Scenarios, or import your book of business, to build your prospecting list and weekly call queue."
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl">Prospects</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Every open case, ranked by expected commission value, plus this week&rsquo;s top{" "}
        {callQueue.length} to call.
      </p>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">This week&rsquo;s call queue</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          Generated once per week from your highest-value open prospects — stays fixed until next
          Monday.
        </p>
        <div className="mt-4 space-y-3">
          {callQueue.length === 0 && <p className="text-sm text-charcoal/60">No open prospects to queue yet.</p>}
          {callQueue.map((entry) => (
            <div key={entry.scenario.id} className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <p className="text-sm font-medium text-navy">
                  {entry.rank}. {entry.scenario.label}
                </p>
                <p className="mt-1 text-xs text-charcoal/60">Pitch: {entry.pitchStrategyName}</p>
              </div>
              <Link
                href={`/app/scenarios/${entry.scenario.id}/intake`}
                className="whitespace-nowrap text-xs text-navy hover:text-gold"
              >
                Open case
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {bookOpportunities.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-lg font-medium text-navy">Top book opportunities to work next</h2>
          <p className="mt-1 text-xs text-charcoal/50">
            Your highest-value imported clients with no case started yet, ranked by the per-avatar
            Y1 commission model. Start a case and Atlas runs the intake with what the book already
            knows pre-filled.
          </p>
          <div className="mt-4 space-y-3">
            {bookOpportunities.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between border-b border-border pb-3"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{client.name}</p>
                  <p className="text-xs text-charcoal/50">
                    {client.avatar ? AVATAR_LABELS[client.avatar] : "Unclassified"} · est.{" "}
                    {money(client.scoreY1)} Y1
                  </p>
                </div>
                <form action={startCaseFromBookAction}>
                  <input type="hidden" name="bookClientId" value={client.id} />
                  <SubmitButton
                    variant="outline"
                    pendingText="Starting…"
                    className="whitespace-nowrap px-3 py-1.5 text-xs"
                  >
                    Start a case
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs">
            <Link href="/app/book" className="text-navy hover:text-gold">
              See your full book &rarr;
            </Link>
          </p>
        </Card>
      )}

      {prospects.length > 0 && (
      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Full prospecting list</h2>
        <p className="mt-1 text-xs text-charcoal/50">Every open case, ranked by expected commission value.</p>
        <div className="mt-4 space-y-3">
          {prospects.map((prospect) => (
            <div
              key={prospect.scenario.id}
              className="flex items-center justify-between border-b border-border pb-3"
            >
              <div>
                <p className="text-sm font-medium text-navy">{prospect.scenario.label}</p>
                <p className="text-xs text-charcoal/50">{STATUS_LABELS[prospect.scenario.status]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-navy">
                  {prospect.expectedCommissionValue !== null
                    ? money(prospect.expectedCommissionValue)
                    : `${money(prospect.expectedCommission)} (no close rate set)`}
                </p>
                <Link
                  href={`/app/scenarios/${prospect.scenario.id}/intake`}
                  className="text-xs text-navy hover:text-gold"
                >
                  Open case
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}
    </div>
  );
}
