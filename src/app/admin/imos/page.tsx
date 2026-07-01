import Link from "next/link";
import { listImosForAdmin, imoSeatSummary, IMO_PRICE_PER_SEAT } from "@/lib/imo";
import { listUsersForAdmin } from "@/lib/admin";
import { createImoAction, updateImoSeatsAction, assignAgentToImoAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const ORG_TYPES = [
  { value: "imo", label: "IMO" },
  { value: "fmo", label: "FMO" },
  { value: "bga", label: "BGA" },
  { value: "ga", label: "GA" },
];

const selectClassName =
  "rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

export default async function AdminImosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [imos, users] = await Promise.all([listImosForAdmin(), listUsersForAdmin()]);
  const agents = users.filter((u) => u.role === "user");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">IMOs</h1>
        <Link href="/admin/dashboard" className="text-sm text-navy hover:text-gold">
          Master dashboard &rarr;
        </Link>
      </div>
      <p className="mt-2 text-sm text-charcoal/60">
        docs/08-master-dashboard.md section 7 — white-label IMO/FMO/BGA/GA contracts, billed at $
        {IMO_PRICE_PER_SEAT}/seat/month. Contracts are sold and invoiced manually; adding or
        removing seats here just logs the change for the ops team to bill against.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">New IMO contract</h2>
        <form action={createImoAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" name="name" type="text" required />
          <label className="block text-sm font-medium text-charcoal">
            Type
            <select name="organizationType" defaultValue="imo" className={`mt-1 block w-full ${selectClassName}`}>
              {ORG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <Input label="Primary contact name" name="primaryContactName" type="text" />
          <Input label="Primary contact email" name="primaryContactEmail" type="email" />
          <Input label="Seats purchased" name="seatsPurchased" type="number" min={1} required />
          <label className="block text-sm font-medium text-charcoal sm:col-span-2">
            Contract terms
            <textarea
              name="contractTerms"
              rows={2}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </label>
          <SubmitButton pendingText="Creating…" className="sm:col-span-2">
            Create IMO
          </SubmitButton>
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {imos.length === 0 && <p className="text-sm text-charcoal/60">No IMO contracts yet.</p>}
        {imos.map((imo) => {
          const summary = imoSeatSummary(imo);
          return (
            <Card key={imo.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-navy">
                    {imo.name} <span className="text-xs uppercase text-charcoal/50">({imo.organizationType})</span>
                  </h3>
                  <p className="mt-1 text-xs text-charcoal/60">
                    {imo.primaryContactName ?? "No contact name"}
                    {imo.primaryContactEmail ? ` — ${imo.primaryContactEmail}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-navy">
                    {summary.seatsActive} active / {imo.seatsPurchased} purchased seats (
                    {summary.seatsChurning} unfilled) — ${summary.mrr.toLocaleString()}/mo
                  </p>
                </div>
                <form action={updateImoSeatsAction} className="flex flex-shrink-0 items-end gap-2">
                  <input type="hidden" name="imoId" value={imo.id} />
                  <label className="block text-xs font-medium text-charcoal">
                    Seats purchased
                    <input
                      type="number"
                      name="seatsPurchased"
                      min={1}
                      defaultValue={imo.seatsPurchased}
                      className="mt-1 block w-24 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </label>
                  <SubmitButton variant="outline" pendingText="Saving…" className="px-3 py-1.5 text-xs">
                    Update
                  </SubmitButton>
                </form>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
                  Seated agents
                </p>
                <div className="mt-2 space-y-2">
                  {imo.agents.length === 0 && (
                    <p className="text-sm text-charcoal/60">No agents assigned yet.</p>
                  )}
                  {imo.agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">{agent.name ?? agent.email}</span>
                      <form action={assignAgentToImoAction}>
                        <input type="hidden" name="agentUserId" value={agent.id} />
                        <input type="hidden" name="imoId" value="" />
                        <SubmitButton variant="outline" pendingText="Removing…" className="px-3 py-1 text-xs">
                          Remove seat
                        </SubmitButton>
                      </form>
                    </div>
                  ))}
                </div>

                <form action={assignAgentToImoAction} className="mt-3 flex items-end gap-2">
                  <input type="hidden" name="imoId" value={imo.id} />
                  <label className="block text-xs font-medium text-charcoal">
                    Assign agent
                    <select name="agentUserId" defaultValue="" required className={`mt-1 block w-56 ${selectClassName}`}>
                      <option value="" disabled>
                        Choose an agent
                      </option>
                      {agents
                        .filter((a) => a.imoId !== imo.id)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name ?? a.email}
                            {a.imoId ? " (already seated elsewhere)" : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                  <SubmitButton variant="outline" pendingText="Assigning…" className="px-3 py-1.5 text-xs">
                    Add seat
                  </SubmitButton>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
