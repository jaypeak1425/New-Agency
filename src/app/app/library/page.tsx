import Link from "next/link";
import { listDocumentedStrategies } from "@/lib/strategies";
import { groupStrategiesByCategory, CATEGORY_LABELS, conceptEntry } from "@/lib/concept-library";
import { CLIENT_PITCH } from "@/lib/pitch-deck-content";
import { fieldPlaybook } from "@/lib/sales-playbook";
import { Card } from "@/components/ui/Card";

// The Concept Library (owner directive 2026-07-06): every live strategy in
// the Brain, organized by concept category. Each concept page carries the
// four pieces — internal explanation, client-facing one-pager, case study,
// top-10 CPA/client questions. Brain lock applies: only `documented`
// strategies appear here, same as the recommendation engine.
export default async function LibraryPage() {
  const strategies = await listDocumentedStrategies();
  const groups = groupStrategiesByCategory(strategies);

  return (
    <div>
      <h1 className="text-3xl">Library</h1>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/60">
        Every concept in the locked strategy library — how it works, the client-facing one-pager,
        a case study, and the ten questions a CPA or client will ask. Organized by concept, drawn
        only from the strategies Atlas actually recommends.
      </p>

      {groups.map(({ category, strategies: bucket }) => (
        <section key={category} className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
            {CATEGORY_LABELS[category]}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {bucket.map((strategy) => {
              const entry = conceptEntry(strategy.slug)!;
              const hasOnePager = Boolean(CLIENT_PITCH[strategy.slug]);
              return (
                <Card key={strategy.id} className="p-6">
                  <h3 className="text-lg font-medium text-navy">
                    <Link href={`/app/library/${strategy.slug}`} className="hover:text-gold">
                      {strategy.name}
                    </Link>
                  </h3>
                  {strategy.whyUsed && (
                    <p className="mt-2 text-sm text-charcoal/70">{strategy.whyUsed}</p>
                  )}
                  <p className="mt-3 text-xs text-charcoal/50">
                    Internal concept · {hasOnePager ? "client one-pager · " : ""}case study
                    {" · "}
                    {entry.topQuestions.length} CPA/client questions
                    {fieldPlaybook(strategy.slug) ? " · field playbook" : ""}
                  </p>
                  <Link
                    href={`/app/library/${strategy.slug}`}
                    className="mt-3 inline-block text-sm text-navy underline hover:text-gold"
                  >
                    Open the concept &rarr;
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="mt-8 text-sm text-charcoal/60">
          The library is empty — run the seed so the documented strategies load.
        </p>
      )}
    </div>
  );
}
