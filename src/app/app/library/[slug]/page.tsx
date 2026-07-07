import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { conceptEntry, CATEGORY_LABELS } from "@/lib/concept-library";
import { CLIENT_PITCH } from "@/lib/pitch-deck-content";
import { CPA_SCRUTINY, TIER_LABELS } from "@/lib/cpa-scrutiny";
import { fieldPlaybook } from "@/lib/sales-playbook";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const ASKER_LABELS = { cpa: "CPA", client: "Client" } as const;

// One concept, four pieces: the internal explanation (the Strategy card),
// the client-facing one-pager (linked — it renders on its own print-clean
// page), the case study, and the top-10 CPA/client questions. Brain lock:
// only a `documented` strategy renders.
export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const strategy = await prisma.strategy.findUnique({ where: { slug } });
  const entry = conceptEntry(slug);
  if (!strategy || strategy.status !== "documented" || !entry) notFound();

  const scrutiny = CPA_SCRUTINY[slug];
  const hasOnePager = Boolean(CLIENT_PITCH[slug]);
  const playbook = fieldPlaybook(slug);

  return (
    <div className="max-w-3xl">
      <Link href="/app/library" className="text-sm text-navy hover:text-gold">
        &larr; Back to the library
      </Link>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
        {CATEGORY_LABELS[entry.category]}
      </p>
      <h1 className="mt-1 text-3xl">{strategy.name}</h1>
      {hasOnePager && (
        <p className="mt-3 text-sm">
          <Link
            href={`/app/library/${slug}/one-pager`}
            className="rounded-md bg-navy px-3 py-1.5 text-cream hover:bg-navy/90"
          >
            Client one-pager (print-ready) &rarr;
          </Link>
        </p>
      )}

      {/* 1 — Internal concept (agent-facing) */}
      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">The concept — how it works</h2>
        {strategy.whyUsed && <p className="mt-3 text-sm text-charcoal/80">{strategy.whyUsed}</p>}
        {strategy.clientTriggerProfile && (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
              Who it&rsquo;s for
            </p>
            <p className="mt-1 text-sm text-charcoal/80">{strategy.clientTriggerProfile}</p>
          </>
        )}
        {strategy.mechanics && (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
              Mechanics
            </p>
            <p className="mt-1 text-sm text-charcoal/80">{strategy.mechanics}</p>
          </>
        )}
        {strategy.legalBasis && (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
              Legal basis
            </p>
            <p className="mt-1 text-sm text-charcoal/80">{strategy.legalBasis}</p>
          </>
        )}
        {strategy.uplineQuestions.length > 0 && (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
              Questions to work with your upline
            </p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {strategy.uplineQuestions.map((q) => (
                <li key={q} className="text-sm text-charcoal/80">
                  {q}
                </li>
              ))}
            </ul>
          </>
        )}
        {scrutiny && (
          <div className="mt-4 rounded-md bg-cream px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
              CPA scrutiny
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal",
                  scrutiny.tier === 1 && "bg-gold/25 text-navy",
                  scrutiny.tier === 2 && "bg-charcoal/10 text-charcoal",
                  scrutiny.tier === 3 && "bg-red-50 text-red-700",
                )}
              >
                {TIER_LABELS[scrutiny.tier]}
              </span>
            </p>
            <p className="mt-2 text-sm text-charcoal/80">{scrutiny.verdict}</p>
          </div>
        )}
      </Card>

      {/* Field playbook (docs/31 — the sales layer: hook, pitch, objections) */}
      {playbook && (
        <Card variant="dark" className="mt-6">
          <h2 className="text-lg font-medium text-cream">Field playbook — how to sell it</h2>
          <p className="mt-1 text-xs text-cream/60">
            docs/31 talk tracks. Compliance built in: non-taxable (never tax-free), claims
            conditioned while in force, no structure names in client copy — diagnose first.
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold">
            Ideal client / trigger
          </p>
          <p className="mt-1 text-sm text-cream/90">{playbook.idealClient}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold">
            Why it sells (the hook)
          </p>
          <p className="mt-1 text-sm text-cream/90">{playbook.hook}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold">
            Positioning (compliant)
          </p>
          <p className="mt-1 text-sm text-cream/90">{playbook.positioning}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold">The pitch</p>
          <blockquote className="mt-1 border-l-2 border-gold pl-3 text-sm italic leading-relaxed text-cream/90">
            &ldquo;{playbook.pitch}&rdquo;
          </blockquote>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gold">
            Objections &rarr; responses
          </p>
          <div className="mt-1 space-y-2">
            {playbook.objections.map((o) => (
              <p key={o.objection} className="text-sm leading-relaxed text-cream/90">
                <span className="font-medium text-cream">&ldquo;{o.objection}&rdquo;</span>
                {" → "}
                {o.response}
              </p>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gold">
                Cross-sell / next
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {playbook.crossSell.map((item) => (
                  <li key={item} className="text-sm text-cream/90">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gold">COI needed</p>
              <p className="mt-1 text-sm text-cream/90">{playbook.coi}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 2 — Case study */}
      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">Case study — {entry.caseStudy.title}</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          Illustrative composite for training and marketing conversations — not a specific client,
          and not a promise of outcomes.
        </p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
          The situation
        </p>
        <p className="mt-1 text-sm text-charcoal/80">{entry.caseStudy.situation}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
          The design
        </p>
        <p className="mt-1 text-sm text-charcoal/80">{entry.caseStudy.design}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-charcoal/50">
          The outcome
        </p>
        <p className="mt-1 text-sm text-charcoal/80">{entry.caseStudy.outcome}</p>
      </Card>

      {/* 3 — Top 10 questions */}
      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">
          The 10 questions a CPA or client will ask
        </h2>
        <p className="mt-1 text-xs text-charcoal/50">
          Walk in already holding the answers — that&rsquo;s the whole trick.
        </p>
        <div className="mt-4 space-y-4">
          {entry.topQuestions.map((question, i) => (
            <div key={question.q} className="border-b border-border pb-3 last:border-b-0">
              <p className="text-sm font-medium text-navy">
                <span
                  className={cn(
                    "mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    question.asker === "cpa" ? "bg-navy/10 text-navy" : "bg-gold/20 text-navy",
                  )}
                >
                  {ASKER_LABELS[question.asker]}
                </span>
                {i + 1}. {question.q}
              </p>
              <p className="mt-1.5 text-sm text-charcoal/80">{question.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
