import { welcomeEmail } from "./emails/welcome";
import { passwordResetEmail } from "./emails/password-reset";
import { billingAlertEmail, type BillingAlertType } from "./emails/billing-alert";
import { wholesalerInviteEmail } from "./emails/wholesaler-invite";

// No email provider is wired up yet — swap the body of this function for a
// real provider (Resend, Postmark, Supabase, etc.) when one is chosen.
// Logging keeps every flow testable without live credentials.
async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
  console.log(html);
}

export async function sendWelcomeEmail(to: string, name: string | null, appBaseUrl: string) {
  const { subject, html } = welcomeEmail({ name, appBaseUrl });
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
