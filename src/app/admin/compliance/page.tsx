import Link from "next/link";
import { getComplianceQueue, getResolvedComplianceFlags } from "@/lib/compliance-queue";
import { runPeriodicAuditAction, resolveComplianceFlagAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/ui/Card";

const TRIGGER_LABELS = {
  filter_caught: "Filter-caught",
  pre_launch: "Pre-launch (new strategy)",
  periodic_audit: "Periodic audit",
};

function ageInDays(date: Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
}

export default async function AdminCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [queue, resolved] = await Promise.all([getComplianceQueue(), getResolvedComplianceFlags()]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Compliance Flag Queue</h1>
        <Link href="/admin/dashboard" className="text-sm text-navy hover:text-gold">
          Master dashboard &rarr;
        </Link>
      </div>
      <p className="mt-2 text-sm text-charcoal/60">
        docs/08-master-dashboard.md section 4. Filter-caught flags have no live client-facing
        pipeline to fire from yet — this app has no client-facing output (see the strategy library
        page). Pre-launch flags come from the strategy library; periodic-audit flags sample real
        sent wholesaler handoffs.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={runPeriodicAuditAction} className="mt-6">
        <SubmitButton pendingText="Running…">Run periodic audit (5% of sent handoffs)</SubmitButton>
      </form>

      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-medium text-navy">Open ({queue.length})</h2>
        {queue.length === 0 && <p className="text-sm text-charcoal/60">Nothing waiting for review.</p>}
        {queue.map((flag) => (
          <Card key={flag.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-navy">{TRIGGER_LABELS[flag.triggerType]}</p>
                <p className="mt-1 text-xs text-charcoal/50">
                  {flag.strategy ? `Strategy: ${flag.strategy.name}` : null}
                  {flag.scenario ? `Case: ${flag.scenario.label}` : null}
                  {" — "}
                  {ageInDays(flag.createdAt)} day(s) old
                </p>
              </div>
            </div>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-cream p-3 text-xs text-charcoal/80">
              {flag.content}
            </pre>
            <form action={resolveComplianceFlagAction} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="flagId" value={flag.id} />
              <label className="block text-xs font-medium text-charcoal">
                Resolution
                <select
                  name="resolution"
                  defaultValue="cleared"
                  className="mt-1 block rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="cleared">Clear</option>
                  <option value="rejected">Reject</option>
                  <option value="escalated">Escalate</option>
                </select>
              </label>
              <label className="block flex-1 text-xs font-medium text-charcoal">
                Notes
                <input
                  type="text"
                  name="resolutionNotes"
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </label>
              <SubmitButton variant="outline" pendingText="Saving…" className="px-3 py-1.5 text-xs">
                Resolve
              </SubmitButton>
            </form>
          </Card>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-medium text-navy">Recently resolved</h2>
        {resolved.length === 0 && <p className="text-sm text-charcoal/60">No resolutions yet.</p>}
        {resolved.map((flag) => (
          <div key={flag.id} className="flex items-center justify-between border-b border-border pb-2 text-sm">
            <div>
              <p className="text-navy">
                {TRIGGER_LABELS[flag.triggerType]} — {flag.strategy?.name ?? flag.scenario?.label ?? "—"}
              </p>
              {flag.resolutionNotes && <p className="text-xs text-charcoal/60">{flag.resolutionNotes}</p>}
            </div>
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{flag.status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
