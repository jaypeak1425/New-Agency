import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { computeDashboard } from "@/lib/dashboard";
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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { thisWeek, thisYear, closedThisYear, bookOpportunity } = await computeDashboard(user!.id);

  const hasAnyScenarios = thisYear.lines.length > 0;
  if (!hasAnyScenarios && !bookOpportunity) {
    return (
      <EmptyState
        title="Dashboard"
        body="No scenarios yet. Run an “I've got a guy” intake to see your pipeline, book-of-business opportunity, and closed commissions here."
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">This week&rsquo;s pipeline</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(thisWeek.total)}</p>
          <p className="mt-1 text-xs text-charcoal/50">{thisWeek.lines.length} active this week</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">This year&rsquo;s pipeline</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(thisYear.total)}</p>
          <p className="mt-1 text-xs text-charcoal/50">{thisYear.lines.length} cases YTD</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Book-of-business opportunity</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            {bookOpportunity ? money(bookOpportunity.addressableOpportunity) : "—"}
          </p>
          <p className="mt-1 text-xs text-charcoal/50">
            {bookOpportunity
              ? `addressable of ${money(bookOpportunity.totalOpportunity)} total`
              : "Add your book in Settings"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Closed this year</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(closedThisYear.total)}</p>
          <p className="mt-1 text-xs text-charcoal/50">{closedThisYear.scenarios.length} won this year</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">This year&rsquo;s pipeline by status</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((status) => (
            <div key={status}>
              <p className="text-xs uppercase tracking-wide text-charcoal/50">{STATUS_LABELS[status]}</p>
              <p className="mt-1 text-lg font-medium text-navy">{money(thisYear.byStatus[status].total)}</p>
              <p className="text-xs text-charcoal/50">{thisYear.byStatus[status].count} case(s)</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-navy">Active scenarios</h2>
          <Link href="/app/scenarios" className="text-xs text-navy hover:text-gold">
            View all cases →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {thisYear.lines
            .filter((line) => line.scenario.status !== "closed_won" && line.scenario.status !== "closed_lost")
            .map((line) => (
              <div key={line.scenario.id} className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="text-sm font-medium text-navy">{line.scenario.label}</p>
                  <p className="text-xs text-charcoal/50">{STATUS_LABELS[line.scenario.status]}</p>
                </div>
                <p className="text-sm text-navy">
                  {line.expectedCommissionValue !== null
                    ? money(line.expectedCommissionValue)
                    : `${money(line.expectedCommission)} (set relationship type for a close-rate estimate)`}
                </p>
              </div>
            ))}
          {thisYear.lines.filter(
            (line) => line.scenario.status !== "closed_won" && line.scenario.status !== "closed_lost",
          ).length === 0 && <p className="text-sm text-charcoal/60">No open scenarios right now.</p>}
        </div>
      </Card>
    </div>
  );
}
