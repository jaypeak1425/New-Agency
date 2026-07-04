import { emailShell, emailButton } from "./shell";

export function imoPrincipalInviteEmail(params: { name?: string | null; imoName: string; setupUrl: string }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";
  const subject = "Your Case Atlas IMO portal is ready";
  const html = emailShell({
    preheader: "Set your password to access your IMO portal.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        Your Case Atlas white-label portal for <strong>${params.imoName}</strong> is ready. You'll
        use it to see your seated agents' activity, your MRR contribution, and your seat
        utilization.
      </p>
      ${emailButton(params.setupUrl, "Set your password")}
      <p style="margin: 16px 0 0; font-size: 13px; color: #8a8378;">
        This link expires in 30 minutes and can only be used once.
      </p>
    `,
  });
  return { subject, html };
}
