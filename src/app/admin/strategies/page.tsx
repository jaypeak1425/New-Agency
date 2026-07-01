import Link from "next/link";
import { listAllStrategiesForAdmin } from "@/lib/strategies";
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

export default async function AdminStrategiesPage() {
  const strategies = await listAllStrategiesForAdmin();
  const core = strategies.filter((s) => s.tier === "core");
  const supporting = strategies.filter((s) => s.tier === "supporting");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin" className="text-sm text-navy hover:text-gold">
        &larr; Back to admin
      </Link>
      <h1 className="mt-4 text-3xl">Strategy library</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        The locked strategy library (docs/00-developer-brief.md: 9 core + 8 supporting). Only
        &ldquo;Documented&rdquo; strategies are eligible for the recommendation engine — per the
        Brain Lock rule, a &ldquo;Pending content&rdquo; row is never surfaced to an agent.
      </p>

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
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
