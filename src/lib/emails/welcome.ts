import { emailShell, emailButton } from "./shell";

export function welcomeEmail(params: { name?: string | null; appBaseUrl: string }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";
  const subject = "Welcome to Case Atlas";
  const html = emailShell({
    preheader: "Your account is ready. Run your first “I've got a guy” scenario.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        Welcome to Case Atlas — the strategy engine for the producer who's done guessing.
      </p>
      <p style="margin: 0 0 16px;">
        Once you're subscribed, open the dashboard and type &ldquo;I&rsquo;ve got a guy&rdquo;
        to run your first scenario. Atlas will ask a few questions and hand you back the
        strategy stack, the pitch order, and the wholesaler handoff — ready for your next
        meeting.
      </p>
      ${emailButton(`${params.appBaseUrl}/app`, "Go to your dashboard")}
      <p style="margin: 16px 0 0; font-size: 13px; color: #8a8378;">
        Questions? Just reply to this email.
      </p>
    `,
  });
  return { subject, html };
}
