import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buildPitchDeck } from "@/lib/pitch-deck";
import { PrintButton } from "@/components/PrintButton";

// The prospect-facing pitch deck: print-ready (browser print → PDF), one
// slide per page, agent chrome hidden on print. Content is built and
// compliance-filtered server-side in src/lib/pitch-deck.ts.
export default async function PitchDeckPage({
  params,
}: {
  params: Promise<{ id: string; strategyId: string }>;
}) {
  const { id, strategyId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const deck = await buildPitchDeck(user, id, strategyId);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/app/scenarios/${id}/intake`} className="text-sm text-navy hover:text-gold">
          &larr; Back to the case design
        </Link>
        {deck.ready && <PrintButton />}
      </div>

      {!deck.ready ? (
        <div className="mt-6 max-w-xl rounded-lg border border-border bg-surface p-8">
          <h1 className="text-xl text-navy">
            {deck.strategy ? deck.strategy.name : "Pitch deck"}
          </h1>
          <p className="mt-3 text-sm text-charcoal/70">{deck.reason}</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs text-charcoal/50 print:hidden">
            Client-ready — every line passed the compliance filter
            {deck.fixesApplied.length > 0 &&
              ` (${deck.fixesApplied.length} automatic language fix${deck.fixesApplied.length === 1 ? "" : "es"} applied)`}
            . Print or save as PDF and it&rsquo;s ready to hand across the table.
          </p>

          <div className="mt-6 space-y-6 print:mt-0 print:space-y-0">
            {deck.slides.map((slide, index) => (
              <section
                key={slide.title}
                className="rounded-lg border border-border bg-surface p-10 shadow-sm print:flex print:min-h-screen print:flex-col print:justify-center print:rounded-none print:border-0 print:shadow-none"
                style={{ breakAfter: index < deck.slides.length - 1 ? "page" : "auto" }}
              >
                {index === 0 ? (
                  <>
                    <p className="text-xs uppercase tracking-widest text-gold">
                      Peakbritt Financial Group
                    </p>
                    <h1 className="mt-4 font-serif text-3xl text-navy">{slide.title}</h1>
                  </>
                ) : (
                  <h2 className="font-serif text-2xl text-navy">{slide.title}</h2>
                )}

                {slide.paragraphs.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {slide.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-relaxed text-charcoal/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}

                {slide.bullets.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {slide.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gold" />
                        <span className="text-sm leading-relaxed text-charcoal/80">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-8 text-[10px] text-charcoal/40">
                  Prepared by {user.name ?? user.email} · Peakbritt Financial Group · Educational
                  overview — not tax or legal advice.
                </p>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
