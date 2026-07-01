import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { rankProspects, getOrCreateWeeklyCallQueue } from "@/lib/prospecting";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

const STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  in_underwriting: "In underwriting",
  closed_won: "Closed — won",
  closed_lost: "Closed — lost",
};

function money(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export default async function ProspectsPage() {
  const user = await getCurrentUser();
  const [prospects, callQueue] = await Promise.all([
    rankProspects(user!.id),
    getOrCreateWeeklyCallQueue(user!.id),
  ]);

  if (prospects.length === 0) {
    return (
      <EmptyState
        title="Prospects"
        body="No prospects yet. Run an “I've got a guy” intake from Scenarios to build your prospecting list and weekly call queue."
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
    </div>
  );
}
