import { getCurrentUser } from "@/lib/auth";
import { listCasesForWholesaler } from "@/lib/wholesaler";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { ScenarioStatusBadge } from "@/components/ScenarioStatusBadge";

export default async function WholesalerPortalPage() {
  const user = await getCurrentUser();
  const agents = await listCasesForWholesaler(user!.id);

  if (agents.length === 0) {
    return (
      <EmptyState
        title="Your agents"
        body="No agents are assigned to you yet. An admin assigns agents to a wholesaler from the Case Atlas admin console."
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl">Your agents</h1>
      <div className="mt-6 space-y-6">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <h2 className="text-lg font-medium text-navy">{agent.name ?? agent.email}</h2>
            <p className="text-sm text-charcoal/60">{agent.email}</p>

            {agent.scenarios.length === 0 ? (
              <p className="mt-4 text-sm text-charcoal/70">No cases yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream text-xs uppercase tracking-wide text-charcoal/60">
                    <tr>
                      <th className="px-4 py-2 font-medium">Case</th>
                      <th className="px-4 py-2 font-medium">Notes</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Last notified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agent.scenarios.map((scenario) => (
                      <tr key={scenario.id} className="border-t border-border">
                        <td className="px-4 py-2">{scenario.label}</td>
                        <td className="px-4 py-2 text-charcoal/70">{scenario.notes ?? "—"}</td>
                        <td className="px-4 py-2">
                          <ScenarioStatusBadge status={scenario.status} />
                        </td>
                        <td className="px-4 py-2">
                          {scenario.wholesalerNotifiedAt
                            ? new Date(scenario.wholesalerNotifiedAt).toLocaleString()
                            : "Not yet"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
