import { emailShell, emailButton } from "./shell";

export function wholesalerInviteEmail(params: { name?: string | null; setupUrl: string }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";
  const subject = "You've been added to Case Atlas";
  const html = emailShell({
    preheader: "Set your password to access your wholesaler portal.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        An agency admin has set up a wholesaler account for you in Case Atlas. You'll use it to
        see the cases your assigned agents are working and get notified when they need you.
      </p>
      ${emailButton(params.setupUrl, "Set your password")}
      <p style="margin: 16px 0 0; font-size: 13px; color: #8a8378;">
        This link expires in 30 minutes and can only be used once.
      </p>
    `,
  });
  return { subject, html };
}
