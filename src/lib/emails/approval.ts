import { emailShell, emailButton } from "./shell";

// The three emails of the approval gate: the applicant's "we got it", the
// admin's "someone's at the door", and the applicant's "you're in".

export function applicationReceivedEmail(params: { name?: string | null }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";
  const subject = "Your Case Atlas application is in review";
  const html = emailShell({
    preheader: "We review every producer personally. You'll hear from us shortly.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        Thanks for applying to Case Atlas. Access is by approval — we review every
        producer personally before opening the platform, because the strategy library
        and training inside are proprietary to Peakbritt Financial Group.
      </p>
      <p style="margin: 0 0 16px;">
        You&rsquo;ll get an email as soon as your account is approved. No action is
        needed from you in the meantime.
      </p>
      <p style="margin: 16px 0 0; font-size: 13px; color: #8a8378;">
        Questions? Just reply to this email.
      </p>
    `,
  });
  return { subject, html };
}

export function adminNewSignupEmail(params: {
  applicantEmail: string;
  applicantName?: string | null;
  appBaseUrl: string;
}) {
  const who = params.applicantName
    ? `${params.applicantName} (${params.applicantEmail})`
    : params.applicantEmail;
  const subject = `New Case Atlas signup awaiting approval: ${params.applicantEmail}`;
  const html = emailShell({
    preheader: "A new producer applied and is waiting on your sign-off.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">
        <strong>${who}</strong> just signed up for Case Atlas and is waiting on approval.
      </p>
      <p style="margin: 0 0 16px;">
        They can&rsquo;t see the dashboard, the strategy library, or training content
        until you approve them from the admin console.
      </p>
      ${emailButton(`${params.appBaseUrl}/admin`, "Review in the admin console")}
    `,
  });
  return { subject, html };
}

export function accountApprovedEmail(params: { name?: string | null; appBaseUrl: string }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";
  const subject = "You're approved — welcome to Case Atlas";
  const html = emailShell({
    preheader: "Your account is approved. Log in and run your first scenario.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        Your Case Atlas account has been approved — welcome aboard.
      </p>
      <p style="margin: 0 0 16px;">
        Log in, complete your subscription if you haven&rsquo;t already, and type
        &ldquo;I&rsquo;ve got a guy&rdquo; to run your first scenario. Atlas will hand
        back the strategy stack, the pitch order, and the wholesaler handoff — ready
        for your next meeting.
      </p>
      ${emailButton(`${params.appBaseUrl}/login`, "Log in to Case Atlas")}
      <p style="margin: 16px 0 0; font-size: 13px; color: #8a8378;">
        Questions? Just reply to this email.
      </p>
    `,
  });
  return { subject, html };
}
