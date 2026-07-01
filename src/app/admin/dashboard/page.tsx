import Link from "next/link";
import {
  getClientsList,
  getRevenueMetrics,
  getActivityMetrics,
  getChurnMetrics,
} from "@/lib/master-dashboard";
import { Card } from "@/components/ui/Card";

function money(amount: number) {
  return `$${amount.toLocaleString()}`;
}

function formatDate(date: Date | null) {
  return date ? new Date(date).toLocaleDateString() : "Never";
}

const ENGAGEMENT_LABELS = { high: "High", medium: "Medium", low: "Low" };

export default async function MasterDashboardPage() {
  const [clients, revenue, activity, churn] = await Promise.all([
    getClientsList(),
    getRevenueMetrics(),
    getActivityMetrics(),
    getChurnMetrics(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Master dashboard</h1>
        <div className="flex gap-4">
          <Link href="/admin" className="text-sm text-navy hover:text-gold">
            Clients &amp; actions &rarr;
          </Link>
          <Link href="/admin/strategies" className="text-sm text-navy hover:text-gold">
            Strategy library &rarr;
          </Link>
        </div>
      </div>
      <p className="mt-2 text-sm text-charcoal/60">
        docs/08-master-dashboard.md — Module 1 (Clients/Agents tab) lives on the{" "}
        <Link href="/admin" className="underline hover:text-gold">
          Clients &amp; actions
        </Link>{" "}
        page. The IMOs tab, Support module, and Compliance Flag Queue aren&rsquo;t built yet — no
        IMO data model, ticketing system, or compliance-flag schema exists in this repo yet
        (separate sessions).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Total MRR</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(revenue.totalMRR)}</p>
          <p className="mt-1 text-xs text-charcoal/50">{revenue.activePayingCount} paying agents</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">New MRR this month</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(revenue.newMRRThisMonth)}</p>
          <p className="mt-1 text-xs text-charcoal/50">
            {revenue.newSubscriptionsThisMonth} new subscription(s)
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Churned MRR this month</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(revenue.churnedMRRThisMonth)}</p>
          <p className="mt-1 text-xs text-charcoal/50">
            {revenue.churnedSubscriptionsThisMonth} cancellation(s)
            {revenue.churnRatePercent !== null ? ` — ${revenue.churnRatePercent}% churn rate` : ""}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Activation rate</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            {activity.activationRatePercent !== null ? `${activity.activationRatePercent}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-charcoal/50">
            ran a first scenario within 7 days · avg engagement:{" "}
            {activity.avgEngagementScore ? ENGAGEMENT_LABELS[activity.avgEngagementScore] : "—"}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Activity trends</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Scenarios this week</p>
            <p className="mt-1 text-lg font-medium text-navy">{activity.scenariosThisWeek}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50">This month</p>
            <p className="mt-1 text-lg font-medium text-navy">{activity.scenariosThisMonth}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50">This quarter</p>
            <p className="mt-1 text-lg font-medium text-navy">{activity.scenariosThisQuarter}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Handoffs sent (7d)</p>
            <p className="mt-1 text-lg font-medium text-navy">{activity.handoffsSentThisWeek}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Pivots triggered (7d)</p>
            <p className="mt-1 text-lg font-medium text-navy">{activity.pivotsTriggeredThisWeek}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Top active agents (last 7 days)</h2>
        <div className="mt-4 space-y-2">
          {activity.topActiveAgents.length === 0 && (
            <p className="text-sm text-charcoal/60">No agent activity in the last 7 days.</p>
          )}
          {activity.topActiveAgents.map((entry) => (
            <div key={entry.user.id} className="flex items-center justify-between border-b border-border pb-2">
              <p className="text-sm text-navy">{entry.user.name ?? entry.user.email}</p>
              <p className="text-xs text-charcoal/60">
                {entry.scenariosCreated} scenario(s) · {entry.handoffsSent} handoff(s)
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">At-risk agents</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          No login in 14+ days, or 0 active scenarios with no new prospect in 60+ days.
        </p>
        <div className="mt-4 space-y-2">
          {churn.atRiskAgents.length === 0 && <p className="text-sm text-charcoal/60">No at-risk agents right now.</p>}
          {churn.atRiskAgents.map((entry) => (
            <div key={entry.user.id} className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <p className="text-sm text-navy">{entry.user.name ?? entry.user.email}</p>
                <p className="text-xs text-charcoal/60">{entry.reason}</p>
              </div>
              <p className="text-xs text-charcoal/50">Last login: {formatDate(entry.lastLoginAt)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Churned this month</h2>
        <div className="mt-4 space-y-2">
          {churn.churnedThisMonth.length === 0 && (
            <p className="text-sm text-charcoal/60">No cancellations this month.</p>
          )}
          {churn.churnedThisMonth.map((entry) => (
            <div key={entry.user.id} className="flex items-center justify-between border-b border-border pb-2">
              <p className="text-sm text-navy">{entry.user.name ?? entry.user.email}</p>
              <p className="text-xs text-charcoal/50">
                Cancelled {formatDate(entry.subscription.updatedAt)} — $97/mo lost
              </p>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-6 text-xs text-charcoal/40">{clients.length} total agents on the platform.</p>
    </main>
  );
}
