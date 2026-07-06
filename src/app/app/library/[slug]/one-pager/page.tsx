import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CLIENT_PITCH } from "@/lib/pitch-deck-content";
import { complianceFilter } from "@/lib/compliance-filter";
import { PrintButton } from "@/components/PrintButton";

// The client-facing one-pager for a Library concept — the marketing sheet an
// agent hands a prospect or a CPA's client. Content comes ONLY from the
// locked CLIENT_PITCH narratives, and every string still runs through the
// compliance filter at render (pass → keep, rewrite → auto-fixed, hold →
// dropped). The app shell is print:hidden, so browser print / save-as-PDF
// yields a clean sheet.
function filtered(text: string): string | null {
  const result = complianceFilter(text);
  if (result.status === "hold") return null;
  return result.output;
}

export default async function OnePagerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const strategy = await prisma.strategy.findUnique({ where: { slug } });
  const narrative = CLIENT_PITCH[slug];
  if (!strategy || strategy.status !== "documented" || !narrative) notFound();

  const title = filtered(narrative.clientTitle) ?? strategy.name;
  const approach = filtered(narrative.approach);
  const howItWorks = narrative.howItWorks
    .map(filtered)
    .filter((line): line is string => line !== null);
  const whatToKnow = narrative.whatToKnow
    .map(filtered)
    .filter((line): line is string => line !== null);

  const presenter = user?.name
    ? `${user.name} — Peakbritt Financial Group`
    : "Peakbritt Financial Group";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/app/library/${slug}`} className="text-sm text-navy hover:text-gold">
          &larr; Back to the concept
        </Link>
        <PrintButton />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-10 print:mt-0 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          A planning conversation
        </p>
        <h1 className="mt-2 text-3xl text-navy">{title}</h1>

        {approach && <p className="mt-5 text-sm leading-relaxed text-charcoal/80">{approach}</p>}

        {howItWorks.length > 0 && (
          <>
            <h2 className="mt-7 text-lg font-medium text-navy">How it works</h2>
            <ul className="mt-2 space-y-2">
              {howItWorks.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-relaxed text-charcoal/80">
                  <span className="text-gold">&bull;</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {whatToKnow.length > 0 && (
          <>
            <h2 className="mt-7 text-lg font-medium text-navy">What to keep in mind</h2>
            <ul className="mt-2 space-y-2">
              {whatToKnow.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-relaxed text-charcoal/80">
                  <span className="text-gold">&bull;</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-8 border-t border-border pt-4">
          <p className="text-sm text-navy">{presenter}</p>
          <p className="mt-2 text-xs leading-relaxed text-charcoal/50">
            This overview is educational, not tax or legal advice — your attorney and tax advisor
            are part of the design team. All coverage is subject to underwriting and to the terms
            of the policy as issued.
          </p>
        </div>
      </div>
    </div>
  );
}
