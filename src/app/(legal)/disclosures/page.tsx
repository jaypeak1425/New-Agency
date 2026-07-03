import type { Metadata } from "next";
import { LegalTitle, LegalUpdated, LegalNote, LegalH2, LegalP, LegalUL } from "@/components/legal";

export const metadata: Metadata = {
  title: "Accuracy & Disclosures",
  description:
    "How to read Case Atlas output: it is directional decision-support, not advice, and every figure must be independently verified before it reaches a client.",
  alternates: { canonical: "/disclosures" },
};

export default function DisclosuresPage() {
  return (
    <>
      <LegalTitle>Accuracy &amp; Disclosures</LegalTitle>
      <LegalUpdated date="July 2026" />
      <LegalNote>
        Read this before presenting any Case Atlas output to a client. It explains what the numbers
        and recommendations are — and, just as importantly, what they are not.
      </LegalNote>

      <LegalH2>Case Atlas is decision-support, not advice</LegalH2>
      <LegalP>
        Case Atlas is software that helps a licensed producer organize and design cases. It does not
        provide tax, legal, accounting, or investment advice, and nothing it produces is a
        recommendation to any consumer. Every output is a starting point for a conversation with the
        client and their own professional advisors.
      </LegalP>

      <LegalH2>Recommendations come from a locked library</LegalH2>
      <LegalP>
        The engine recommends only from a curated, human-approved strategy library — it does not
        invent strategies. A strategy&rsquo;s suitability for any specific client still depends on
        facts the software cannot fully verify (health, underwriting, exact financials, state law,
        and the client&rsquo;s goals). Eligibility signals shown in the app are screening aids, not
        determinations of suitability.
      </LegalP>

      <LegalH2>Tax figures are current-year and change</LegalH2>
      <LegalUL>
        <li>
          Quantified estimates use published federal figures for the current tax year and are
          <strong> federal only</strong> — state taxes are out of scope and must be considered
          separately.
        </li>
        <li>
          Figures that depend on future IRS inflation adjustments are marked as pending until the
          IRS publishes them; do not treat a pending value as final.
        </li>
        <li>
          All computations are <strong>directional</strong>, built from rough, agent-entered inputs.
          They are not projections, illustrations, or guarantees, and they must be confirmed with
          the client&rsquo;s CPA before any number is quoted.
        </li>
      </LegalUL>

      <LegalH2>Client-facing materials and compliance language</LegalH2>
      <LegalP>
        Client-facing output is filtered to standard compliance language — for example,
        &ldquo;non-taxable,&rdquo; not &ldquo;tax-free&rdquo;; benefit statements conditioned on the
        policy remaining in force; and no quantified outcome promises. This filter is an aid, not a
        substitute for your firm&rsquo;s own advertising review and your carriers&rsquo;
        requirements. You remain responsible for the compliance of anything you present.
      </LegalP>

      <LegalH2>Illustrations, underwriting, and carriers</LegalH2>
      <LegalP>
        Case Atlas does not issue carrier illustrations or underwriting decisions. Final product
        design, pricing, and issue depend entirely on the carrier&rsquo;s illustration and
        underwriting. Coverage applies only as stated in the policy as issued.
      </LegalP>

      <LegalH2>No guarantee of results</LegalH2>
      <LegalP>
        Past case results, sample numbers, and opportunity estimates do not guarantee future
        commissions, production, or client outcomes. Peakbritt Financial Group is not a CPA firm,
        law firm, or registered investment advisor.
      </LegalP>
    </>
  );
}
