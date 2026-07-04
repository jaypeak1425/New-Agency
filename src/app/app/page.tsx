import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { computeDashboard } from "@/lib/dashboard";
import { computeAtlasFeed } from "@/lib/nudges";
import { countBookClients } from "@/lib/book-import";
import { agingStatusFor, AGING_LABELS } from "@/lib/aging";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/CountUp";
import { SCENARIO_STATUS_LABELS as STATUS_LABELS } from "@/components/ScenarioStatusBadge";

function money(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { thisWeek, thisYear, closedThisYear, bookOpportunity } = await computeDashboard(user!.id);

  const hasAnyScenarios = thisYear.lines.length > 0;
  // A brand-new agent — no cases, no self-reported book, and no imported
  // book yet — gets a proper two-path start instead of a dead-end empty
  // state: log a single case, or import the whole book at once. (Once a
  // book is imported, the highest-value clients surface in Prospects.)
  if (!hasAnyScenarios && !bookOpportunity && (await countBookClients(user!.id)) === 0) {
    return (
      <div>
        <h1 className="text-3xl">Welcome to Case Atlas</h1>
        <p className="mt-2 max-w-2xl text-sm text-charcoal/60">
          Two ways to start. Work a single client you have in mind, or bring your whole book in at
          once and let Atlas rank it for you.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="text-lg font-medium text-navy">&ldquo;I&rsquo;ve got a guy&rdquo;</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Describe one client and Atlas runs the 10-question intake, classifies the avatar, and
              designs the case — recommendations, commission math, and the wholesaler handoff.
            </p>
            <Link
              href="/app/scenarios"
              className="mt-4 inline-block rounded-md bg-navy px-4 py-2 text-sm font-medium text-cream hover:bg-navy/90"
            >
              Start your first case &rarr;
            </Link>
          </Card>
          <Card>
            <h2 className="text-lg font-medium text-navy">Import your book</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Upload a CSV of your clients. Atlas scores every one by opportunity and surfaces the
              highest-value cases to work first — one click turns any of them into a full case.
            </p>
            <Link
              href="/app/book"
              className="mt-4 inline-block rounded-md border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-navy hover:text-cream"
            >
              Import your book &rarr;
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const atlas = await computeAtlasFeed(user!.id);
  const atlasItems = [...atlas.nudges.map((n) => n.message), ...atlas.agingMessages];

  return (
    <div>
      <h1 className="text-3xl">Dashboard</h1>

      {atlasItems.length > 0 && (
        <Card variant="dark" className="mt-6">
          <p className="text-xs uppercase tracking-wide text-gold">Atlas</p>
          <ul className="mt-3 space-y-2">
            {atlasItems.map((message, i) => (
              <li key={i} className="text-sm leading-relaxed text-cream/90">
                {message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">This week&rsquo;s pipeline</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            <CountUp value={thisWeek.total} />
          </p>
          <p className="mt-1 text-xs text-charcoal/50">{thisWeek.lines.length} active this week</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">This year&rsquo;s pipeline</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            <CountUp value={thisYear.total} />
          </p>
          <p className="mt-1 text-xs text-charcoal/50">{thisYear.lines.length} cases YTD</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Book-of-business opportunity</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            {bookOpportunity ? <CountUp value={bookOpportunity.addressableOpportunity} /> : "—"}
          </p>
          <p className="mt-1 text-xs text-charcoal/50">
            {bookOpportunity
              ? `addressable of ${money(bookOpportunity.totalOpportunity)} total`
              : "Add your book in Settings"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Closed this year</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            <CountUp value={closedThisYear.total} />
          </p>
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
            .map((line) => {
              const aging = agingStatusFor(line.scenario.updatedAt);
              return (
              <div key={line.scenario.id} className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="text-sm font-medium text-navy">{line.scenario.label}</p>
                  <p className="text-xs text-charcoal/50">
                    {STATUS_LABELS[line.scenario.status]}
                    {aging.status !== "active" && (
                      <span className="ml-2 text-red-700/70">
                        {AGING_LABELS[aging.status]} — {aging.daysSinceActivity} days idle
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm text-navy">
                  {line.expectedCommissionValue !== null
                    ? money(line.expectedCommissionValue)
                    : `${money(line.expectedCommission)} (set relationship type for a close-rate estimate)`}
                </p>
              </div>
              );
            })}
          {thisYear.lines.filter(
            (line) => line.scenario.status !== "closed_won" && line.scenario.status !== "closed_lost",
          ).length === 0 && <p className="text-sm text-charcoal/60">No open scenarios right now.</p>}
        </div>
      </Card>
    </div>
  );
}
