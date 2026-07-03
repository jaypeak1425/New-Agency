import type { Metadata } from "next";
import { LegalTitle, LegalUpdated, LegalNote, LegalH2, LegalP, LegalUL } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Case Atlas and Peakbritt Financial Group collect, use, and protect the information you and your clients provide.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <LegalTitle>Privacy Policy</LegalTitle>
      <LegalUpdated date="July 2026" />
      <LegalNote>
        This is a plain-language template describing how the Service handles data. Have counsel
        confirm it reflects your actual data practices and applicable privacy laws before you rely
        on it.
      </LegalNote>

      <LegalH2>1. Information we collect</LegalH2>
      <LegalUL>
        <li>
          <strong>Account information</strong> — your name, email, password (stored hashed), and
          subscription status.
        </li>
        <li>
          <strong>Case and book data you enter</strong> — the client scenarios, intake answers,
          imported book-of-business records, and estimates you provide to design cases. This may
          include information about your prospects and clients that you are responsible for having
          the right to enter.
        </li>
        <li>
          <strong>Usage and audit data</strong> — a log of key actions (recommendations,
          approvals, handoffs, compliance events) used to operate and improve the Service.
        </li>
        <li>
          <strong>Payment data</strong> — handled by our payment processor; we do not store full
          card numbers.
        </li>
      </LegalUL>

      <LegalH2>2. How we use it</LegalH2>
      <LegalP>
        We use this information to provide the Service — running the case-design engine, generating
        materials, tracking your pipeline — and to secure, maintain, and improve it. We do not sell
        your data. Client information you enter is processed to produce the output you request and
        is not used to advertise to your clients.
      </LegalP>

      <LegalH2>3. AI processing</LegalH2>
      <LegalP>
        Some optional features send the text you enter to an AI model provider to extract structured
        answers. That processing is limited to producing your requested output; the deterministic
        strategy engine and the compliance filter run on the results. AI features activate only when
        the underlying integration is configured.
      </LegalP>

      <LegalH2>4. Sharing</LegalH2>
      <LegalP>
        We share information only with service providers that help us operate the Service (such as
        hosting, database, payment, and — where configured — email and AI providers), and when
        required by law. When you send a wholesaler handoff, the case content you choose to send is
        shared with the wholesaler you direct it to.
      </LegalP>

      <LegalH2>5. Security and retention</LegalH2>
      <LegalP>
        We use reasonable technical and organizational measures to protect your data, including
        hashed passwords and access controls. No system is perfectly secure. We retain data for as
        long as your account is active and as needed to meet legal and operational obligations.
      </LegalP>

      <LegalH2>6. Your choices</LegalH2>
      <LegalP>
        You may access and update your account information in the app, cancel your subscription at
        any time, and request deletion of your account data subject to legal retention
        requirements. Marketing emails include a one-click unsubscribe.
      </LegalP>

      <LegalH2>7. Changes and contact</LegalH2>
      <LegalP>
        We will post material changes to this policy here with a revised date. Questions can be
        directed to Peakbritt Financial Group.
      </LegalP>
    </>
  );
}
