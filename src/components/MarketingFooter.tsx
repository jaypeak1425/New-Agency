import Link from "next/link";

// Shared footer for the public marketing surface (landing + legal pages):
// the standing compliance disclosures plus links to the full legal pages.
// Kept in one place so the disclosures read identically everywhere they
// appear.
export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface px-6 py-8 text-xs text-charcoal/60">
      <div className="mx-auto max-w-5xl space-y-3">
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-navy">
          <Link href="/terms" className="hover:text-gold">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className="hover:text-gold">
            Privacy Policy
          </Link>
          <Link href="/disclosures" className="hover:text-gold">
            Accuracy &amp; Disclosures
          </Link>
        </nav>
        <p>Case Atlas is a software product. It does not provide tax, legal, or investment advice.</p>
        <p>
          All benefit claims non-taxable while the policy remains in force. Final strategy subject to
          underwriting and client decision.
        </p>
        <p>Past case results do not guarantee future commissions or production.</p>
        <p>
          Peakbritt Financial Group is not a CPA firm, law firm, or registered investment advisor.
          COI relationships are the responsibility of the agent.
        </p>
        <p className="pt-2">&copy; {new Date().getFullYear()} Peakbritt Financial Group.</p>
      </div>
    </footer>
  );
}
