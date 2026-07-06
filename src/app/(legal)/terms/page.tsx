import type { Metadata } from "next";
import { LegalTitle, LegalUpdated, LegalNote, LegalH2, LegalP, LegalUL } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing use of Case Atlas, the insurance case-design software from Peakbritt Financial Group.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <LegalTitle>Terms &amp; Conditions</LegalTitle>
      <LegalUpdated date="July 2026" />
      <LegalNote>
        This is a plain-language template covering how Case Atlas works. It is not itself legal
        advice; have your own counsel review and adapt it before relying on it in production.
      </LegalNote>

      <LegalH2>1. What Case Atlas is</LegalH2>
      <LegalP>
        Case Atlas (&ldquo;the Service&rdquo;) is software provided by Peakbritt Financial Group
        (&ldquo;we,&rdquo; &ldquo;us&rdquo;). It helps licensed insurance and annuity producers
        design cases, generate materials, and organize their pipeline. The Service is a tool. It
        does not provide tax, legal, accounting, or investment advice, and it is not a substitute
        for the judgment of a licensed professional, a carrier illustration, or your own compliance
        review.
      </LegalP>

      <LegalH2>2. Who may use it</LegalH2>
      <LegalP>
        You must be at least 18, use the Service only for lawful purposes, and — where the Service
        is used to design insurance strategies — hold the licenses and appointments required for the
        products and jurisdictions involved. You are responsible for everything done under your
        account and for keeping your credentials secure.
      </LegalP>

      <LegalH2>3. Your responsibility for output</LegalH2>
      <LegalP>
        The Service produces strategy recommendations, quantified estimates, pitch materials, and
        similar output based on the information you enter and on current-year federal tax figures
        that change over time. All output is directional and must be independently verified before
        it reaches a client — including by the client&rsquo;s CPA, attorney, and the issuing
        carrier. You are solely responsible for the accuracy, suitability, and compliance of
        anything you present to a client or submit to a carrier. See our{" "}
        <a href="/disclosures" className="text-navy underline hover:text-gold">
          Accuracy &amp; Disclosures
        </a>{" "}
        page.
      </LegalP>

      <LegalH2>4. Subscriptions and billing</LegalH2>
      <LegalUL>
        <li>The Service is offered on a paid subscription (currently $297/month, billed through our payment processor).</li>
        <li>Subscriptions renew automatically until canceled; you may cancel at any time, effective at the end of the current billing period.</li>
        <li>Our 30-day money-back guarantee, where offered, is described at the point of sale and governs refunds for the initial period.</li>
      </LegalUL>

      <LegalH2>5. Acceptable use</LegalH2>
      <LegalP>
        You agree not to misuse the Service — including by reverse-engineering it, reselling access
        without authorization, uploading unlawful content, attempting to breach its security, or
        using it to generate materials that violate insurance advertising or compliance rules.
      </LegalP>

      <LegalH2>6. Intellectual property</LegalH2>
      <LegalP>
        The Service, its strategy library, and its interfaces are our property. You retain ownership
        of the client and case data you enter, and you grant us the limited rights needed to operate
        the Service for you.
      </LegalP>

      <LegalH2>7. Disclaimers and limitation of liability</LegalH2>
      <LegalP>
        The Service is provided &ldquo;as is,&rdquo; without warranties of any kind. To the fullest
        extent permitted by law, we are not liable for indirect, incidental, or consequential
        damages, or for lost commissions, lost production, or decisions made in reliance on Service
        output. Peakbritt Financial Group is not a CPA firm, law firm, or registered investment
        advisor.
      </LegalP>

      <LegalH2>8. Changes and termination</LegalH2>
      <LegalP>
        We may update these terms or the Service over time; material changes will be posted here
        with a revised date. We may suspend or terminate accounts that violate these terms.
      </LegalP>

      <LegalH2>9. Contact</LegalH2>
      <LegalP>Questions about these terms can be directed to Peakbritt Financial Group.</LegalP>
    </>
  );
}
