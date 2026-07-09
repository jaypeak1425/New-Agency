import Link from "next/link";
import { listDocumentedStrategies } from "@/lib/strategies";
import { groupStrategiesByCategory, CATEGORY_LABELS } from "@/lib/concept-library";
import { CLIENT_PITCH } from "@/lib/pitch-deck-content";
import { fieldPlaybook } from "@/lib/sales-playbook";
import { Card } from "@/components/ui/Card";

// Training (owner directive 2026-07-09): the agent-facing training hub.
// Videos land here as they're produced; until then the section shows a
// branded placeholder. Strategy documents mirror the Library's client
// one-pagers (print-ready — agents print/save them as PDFs) so training and
// field materials live in one place. Auth + approval gated like all of /app.
export default async function TrainingPage() {
  const strategies = await listDocumentedStrategies();
  const groups = groupStrategiesByCategory(strategies);

  return (
    <div>
      <h1 className="text-3xl">Training</h1>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/60">
        Everything you need to run these cases in the field — session videos as they&rsquo;re
        released, and the printable strategy documents behind every concept in the Brain.
      </p>

      {/* Videos — placeholder until content is produced */}
      <Card variant="dark" className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-gold">Video sessions</p>
        <h2 className="mt-2 text-xl text-cream">Coming soon.</h2>
        <p className="mt-2 max-w-xl text-sm text-cream/80">
          Case-design walkthroughs, objection clinics, and CPA-channel training are in
          production. New sessions will appear here first — no announcement emails to chase.
        </p>
      </Card>

      {/* Strategy documents — the Library's print-ready one-pagers */}
      <section className="mt-10">
        <h2 className="text-xl">Strategy documents</h2>
        <p className="mt-1 max-w-2xl text-sm text-charcoal/60">
          The client-facing one-pager for every documented strategy — print-ready, compliance
          filtered. Open one and print (or save as PDF) straight from the page.
        </p>

        {groups.map(({ category, strategies: bucket }) => (
          <div key={category} className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {bucket.map((strategy) => {
                const hasOnePager = Boolean(CLIENT_PITCH[strategy.slug]);
                const hasPlaybook = Boolean(fieldPlaybook(strategy.slug));
                return (
                  <Card key={strategy.id} className="p-4">
                    <p className="text-sm font-medium text-navy">{strategy.name}</p>
                    <p className="mt-2 flex flex-wrap gap-3 text-xs">
                      {hasOnePager && (
                        <Link
                          href={`/app/library/${strategy.slug}/one-pager`}
                          className="text-navy underline hover:text-gold"
                        >
                          Client one-pager (print/PDF)
                        </Link>
                      )}
                      <Link
                        href={`/app/library/${strategy.slug}`}
                        className="text-navy underline hover:text-gold"
                      >
                        Concept deep-dive
                      </Link>
                      {hasPlaybook && (
                        <span className="text-charcoal/50">includes field playbook</span>
                      )}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <p className="mt-6 text-sm text-charcoal/60">
            No strategies loaded yet — run the seed so the documented strategies appear.
          </p>
        )}
      </section>
    </div>
  );
}
