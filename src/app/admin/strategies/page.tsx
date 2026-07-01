import Link from "next/link";
import { listAllStrategiesForAdmin } from "@/lib/strategies";
import { flagStrategyForReviewAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function StatusBadge({ status }: { status: "documented" | "pending_content" }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "documented" ? "bg-gold/20 text-navy" : "bg-charcoal/10 text-charcoal/70",
      )}
    >
      {status === "documented" ? "Documented" : "Pending content"}
    </span>
  );
}

export default async function AdminStrategiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const strategies = await listAllStrategiesForAdmin();
  const core = strategies.filter((s) => s.tier === "core");
  const supporting = strategies.filter((s) => s.tier === "supporting");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-navy hover:text-gold">
          &larr; Back to admin
        </Link>
        <Link href="/admin/compliance" className="text-sm text-navy hover:text-gold">
          Compliance Flag Queue &rarr;
        </Link>
      </div>
      <h1 className="mt-4 text-3xl">Strategy library</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        The locked strategy library (docs/00-developer-brief.md: 9 core + 8 supporting). Only
        &ldquo;Documented&rdquo; strategies are eligible for the recommendation engine — per the
        Brain Lock rule, a &ldquo;Pending content&rdquo; row is never surfaced to an agent. A
        pending strategy can be flagged for pre-launch compliance review (docs/08-master-dashboard.md
        section 4) once its content is ready — clearing that review records the sign-off but doesn&rsquo;t
        flip the status, since going live still needs the real content, not just a compliance pass.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {[
        { label: "Core", items: core },
        { label: "Supporting", items: supporting },
      ].map(({ label, items }) => (
        <section key={label} className="mt-8">
          <h2 className="text-lg font-medium text-navy">
            {label} ({items.length})
          </h2>
          <div className="mt-4 space-y-4">
            {items.map((strategy) => (
              <Card key={strategy.id}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-medium text-navy">{strategy.name}</h3>
                  <StatusBadge status={strategy.status} />
                </div>
                {strategy.clientTriggerProfile && (
                  <p className="mt-2 text-sm text-charcoal/70">{strategy.clientTriggerProfile}</p>
                )}
                {strategy.avatarTags.length > 0 && (
                  <p className="mt-2 text-xs uppercase tracking-wide text-charcoal/50">
                    {strategy.avatarTags.join(", ")}
                  </p>
                )}
                {strategy.notes && (
                  <p className="mt-3 text-xs text-charcoal/50">{strategy.notes}</p>
                )}
                {strategy.status === "pending_content" && (
                  <div className="mt-3 border-t border-border pt-3">
                    {strategy.complianceFlags.length > 0 ? (
                      <p className="text-xs text-charcoal/50">
                        Awaiting pre-launch compliance review (flagged{" "}
                        {new Date(strategy.complianceFlags[0].createdAt).toLocaleDateString()}).
                      </p>
                    ) : (
                      <form action={flagStrategyForReviewAction}>
                        <input type="hidden" name="strategyId" value={strategy.id} />
                        <SubmitButton variant="outline" pendingText="Flagging…" className="px-3 py-1.5 text-xs">
                          Flag for pre-launch review
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
