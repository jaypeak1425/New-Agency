import { welcomeEmail } from "./emails/welcome";
import {
  applicationReceivedEmail,
  adminNewSignupEmail,
  accountApprovedEmail,
} from "./emails/approval";
import { passwordResetEmail } from "./emails/password-reset";
import { billingAlertEmail, type BillingAlertType } from "./emails/billing-alert";
import { wholesalerInviteEmail } from "./emails/wholesaler-invite";
import { wholesalerCaseNotificationEmail } from "./emails/wholesaler-case-notification";
import { imoPrincipalInviteEmail } from "./emails/imo-principal-invite";
import type { HandoffContent } from "./handoff";

// Resend delivers when RESEND_API_KEY is set; otherwise every flow logs to
// the console, which keeps signup/reset/approval testable without live
// credentials (vitest and local dev never need a key).
//
// EMAIL_FROM must be an address on a domain verified in Resend. Until
// peakbritt.com is verified there, the fallback onboarding@resend.dev works
// but only delivers to the Resend account owner's inbox (Resend sandbox
// rule) — fine for testing the approval-gate loop, not for real agents.
//
// A delivery failure is logged, never thrown: a mail outage must not break
// signup, approval, or password reset.
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
    console.log(html);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Case Atlas <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status} sending "${subject}" to ${to}:`, await res.text());
    }
  } catch (error) {
    console.error(`[email] failed sending "${subject}" to ${to}:`, error);
  }
}

export async function sendWelcomeEmail(to: string, name: string | null, appBaseUrl: string) {
  const { subject, html } = welcomeEmail({ name, appBaseUrl });
  await sendEmail(to, subject, html);
}

export async function sendApplicationReceivedEmail(to: string, name: string | null) {
  const { subject, html } = applicationReceivedEmail({ name });
  await sendEmail(to, subject, html);
}

export async function sendAdminNewSignupEmail(
  to: string,
  applicantEmail: string,
  applicantName: string | null,
  appBaseUrl: string,
) {
  const { subject, html } = adminNewSignupEmail({ applicantEmail, applicantName, appBaseUrl });
  await sendEmail(to, subject, html);
}

export async function sendAccountApprovedEmail(
  to: string,
  name: string | null,
  appBaseUrl: string,
) {
  const { subject, html } = accountApprovedEmail({ name, appBaseUrl });
  await sendEmail(to, subject, html);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { subject, html } = passwordResetEmail({ resetUrl });
  await sendEmail(to, subject, html);
}

export async function sendBillingAlertEmail(
  to: string,
  type: BillingAlertType,
  appBaseUrl: string,
) {
  const { subject, html } = billingAlertEmail({ type, appBaseUrl });
  await sendEmail(to, subject, html);
}

export async function sendWholesalerInviteEmail(
  to: string,
  name: string | null,
  setupUrl: string,
) {
  const { subject, html } = wholesalerInviteEmail({ name, setupUrl });
  await sendEmail(to, subject, html);
}

export async function sendImoPrincipalInviteEmail(
  to: string,
  name: string | null,
  imoName: string,
  setupUrl: string,
) {
  const { subject, html } = imoPrincipalInviteEmail({ name, imoName, setupUrl });
  await sendEmail(to, subject, html);
}

export async function sendWholesalerCaseNotificationEmail(
  to: string,
  params: {
    wholesalerName: string | null;
    agentName: string;
    caseLabel: string;
    portalUrl: string;
    handoffContent?: HandoffContent;
  },
) {
  const { subject, html } = wholesalerCaseNotificationEmail(params);
  await sendEmail(to, subject, html);
}
