import { getCurrentUser } from "@/lib/auth";
import { getImoPrincipalView } from "@/lib/imo";
import { Card } from "@/components/ui/Card";

const ENGAGEMENT_LABELS = { high: "High", medium: "Medium", low: "Low" };

function money(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export default async function ImoPrincipalPage() {
  const user = await getCurrentUser();
  const view = await getImoPrincipalView(user!);

  return (
    <div>
      <h1 className="text-3xl">{view.imoName}</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        docs/08-master-dashboard.md section 5 — your agents, your MRR, your seat utilization, and a
        read-only feed of your agents&rsquo; scenarios. You can view your agents&rsquo; activity but
        can&rsquo;t modify Atlas&rsquo;s recommendations — only the internal Case Atlas team can.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">MRR contribution</p>
          <p className="mt-2 text-2xl font-medium text-navy">{money(view.mrr)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Seats</p>
          <p className="mt-2 text-2xl font-medium text-navy">
            {view.seatsActive} / {view.seatsPurchased}
          </p>
          <p className="mt-1 text-xs text-charcoal/50">active of purchased ({view.seatsChurning} unfilled)</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Seated agents</p>
          <p className="mt-2 text-2xl font-medium text-navy">{view.seatUsage.length}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Your agents</h2>
        {view.seatUsage.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/60">No agents seated on your contract yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {view.seatUsage.map(({ agent, engagementScore, scenarioCount }) => (
              <div key={agent.id} className="flex items-center justify-between border-b border-border pb-2 text-sm">
                <span className="text-charcoal">{agent.name ?? agent.email}</span>
                <span className="text-xs text-charcoal/50">
                  {ENGAGEMENT_LABELS[engagementScore]} engagement · {scenarioCount} scenario(s) · last login{" "}
                  {agent.lastLoginAt ? new Date(agent.lastLoginAt).toLocaleDateString() : "never"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Opportunity Flow (read-only)</h2>
        {view.opportunityFlow.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/60">No scenarios from your agents yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {view.opportunityFlow.map(({ scenario, agentName, expectedCommission }) => (
              <div key={scenario.id} className="flex items-center justify-between border-b border-border pb-2 text-sm">
                <div>
                  <p className="text-navy">{scenario.label}</p>
                  <p className="text-xs text-charcoal/50">{agentName} · {scenario.status}</p>
                </div>
                <p className="text-navy">{money(expectedCommission)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
