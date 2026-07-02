import { TAX_REFERENCE } from "@/lib/tax-reference";
import { Card } from "@/components/ui/Card";

// Agent-facing federal tax reference (owner directive 2026-07-02: federal
// only, no state). 2026 actuals from Rev. Proc. 2025-32 + statutes; the
// 2027 column shows what's law-locked today and marks everything awaiting
// the fall-2026 inflation-adjustment revenue procedure.
export default function TaxReferencePage() {
  return (
    <div>
      <h1 className="text-3xl">Federal tax reference</h1>
      <p className="mt-2 max-w-2xl text-sm text-charcoal/60">
        The figures the strategy library keys off — 2026 actuals (Rev. Proc. 2025-32, reflecting
        OBBBA) and what&rsquo;s already law-locked for 2027. Pending values fill in when the IRS
        publishes the fall-2026 inflation adjustments. Federal only; verify state treatment with
        the client&rsquo;s tax advisor. Agent reference — never client-facing copy.
      </p>

      <div className="mt-6 space-y-4">
        {TAX_REFERENCE.map((entry) => (
          <Card key={entry.key} className="max-w-3xl !p-6">
            <h2 className="text-base font-medium text-navy">{entry.label}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-cream px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-charcoal/50">
                  2026
                </p>
                <p className="mt-0.5 text-sm text-charcoal">{entry.y2026}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-charcoal/50">
                  2027
                </p>
                <p className="mt-0.5 text-sm text-charcoal/80">{entry.y2027}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-charcoal/50">Source: {entry.source}</p>
            {entry.note && <p className="mt-1 text-xs text-charcoal/60">{entry.note}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
