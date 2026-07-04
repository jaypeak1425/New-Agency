import Link from "next/link";
import { listAllStrategiesForAdmin, missingCardFields } from "@/lib/strategies";
import { approveStrategyAction, flagStrategyForReviewAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Strategy } from "@/generated/prisma/client";

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

// The full card content, laid out for the docs/09 reviewer: everything the
// recommendation engine and the handoff will show an agent, so the sign-off
// is on the real content, not a summary.
function CardContent({ strategy }: { strategy: Strategy }) {
  const matchingParameters = Array.isArray(strategy.matchingParameters)
    ? strategy.matchingParameters.map(String)
    : [];

  const sections: Array<[string, string | null]> = [
    ["Who this is for", strategy.clientTriggerProfile],
    ["Legal basis", strategy.legalBasis],
    ["Mechanics", strategy.mechanics],
    ["Why it's used", strategy.whyUsed],
  ];

  return (
    <div className="mt-3 space-y-3 text-sm text-charcoal/80">
      {sections.map(
        ([label, value]) =>
          value && (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
                {label}
              </p>
              <p className="mt-0.5">{value}</p>
            </div>
          ),
      )}
      {matchingParameters.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
            Matching parameters
          </p>
          <ul className="mt-0.5 list-inside list-disc font-mono text-xs">
            {matchingParameters.map((param) => (
              <li key={param}>{param}</li>
            ))}
          </ul>
        </div>
      )}
      {strategy.uplineQuestions.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
            Upline questions
          </p>
          <ul className="mt-0.5 list-inside list-decimal text-xs">
            {strategy.uplineQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
      {strategy.sourceDoc && (
        <p className="text-xs text-charcoal/50">Source: {strategy.sourceDoc}</p>
      )}
    </div>
  );
}

export default async function AdminStrategiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; approved?: string }>;
}) {
  const { error, approved } = await searchParams;
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
        The locked strategy library (docs/00-developer-brief.md&rsquo;s original 9 core + 8
        supporting, plus additions entering through the docs/09 validation workflow). Only
        &ldquo;Documented&rdquo; strategies are eligible for the recommendation engine — per the
        Brain Lock rule, a &ldquo;Pending content&rdquo; row is never surfaced to an agent. A fully
        drafted pending card goes live through &ldquo;Approve &amp; go live&rdquo; — the
        docs/09-prelaunch-validation.md Path A single-reviewer sign-off. Review the full card below
        before approving; the approval is audit-logged with a content snapshot and clears any open
        pre-launch compliance flag.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {approved && (
        <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-navy">
          Strategy approved and live — the recommendation engine can now surface it.
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
            {items.map((strategy) => {
              const missing = missingCardFields(strategy);
              return (
                <Card key={strategy.id}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-medium text-navy">{strategy.name}</h3>
                    <StatusBadge status={strategy.status} />
                  </div>
                  {strategy.avatarTags.length > 0 && (
                    <p className="mt-2 text-xs uppercase tracking-wide text-charcoal/50">
                      {strategy.avatarTags.join(", ")}
                    </p>
                  )}
                  <CardContent strategy={strategy} />
                  {strategy.notes && (
                    <p className="mt-3 text-xs text-charcoal/50">{strategy.notes}</p>
                  )}
                  {strategy.status === "pending_content" && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      {missing.length > 0 ? (
                        <p className="text-xs text-charcoal/50">
                          Not ready for sign-off — the card is missing: {missing.join(", ")}.
                        </p>
                      ) : (
                        <form action={approveStrategyAction}>
                          <input type="hidden" name="strategyId" value={strategy.id} />
                          <SubmitButton pendingText="Approving…" className="px-3 py-1.5 text-xs">
                            Approve &amp; go live
                          </SubmitButton>
                        </form>
                      )}
                      {strategy.complianceFlags.length > 0 ? (
                        <p className="text-xs text-charcoal/50">
                          Open pre-launch compliance flag (flagged{" "}
                          {new Date(strategy.complianceFlags[0].createdAt).toLocaleDateString()})
                          — approving clears it as part of the sign-off.
                        </p>
                      ) : (
                        <form action={flagStrategyForReviewAction}>
                          <input type="hidden" name="strategyId" value={strategy.id} />
                          <SubmitButton
                            variant="outline"
                            pendingText="Flagging…"
                            className="px-3 py-1.5 text-xs"
                          >
                            Flag for pre-launch review
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
