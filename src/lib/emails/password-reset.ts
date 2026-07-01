import { emailShell, emailButton } from "./shell";

export function passwordResetEmail(params: { resetUrl: string }) {
  const subject = "Reset your Case Atlas password";
  const html = emailShell({
    preheader: "Use this link to reset your password. It expires in 30 minutes.",
    bodyHtml: `
      <p style="margin: 0 0 16px;">We received a request to reset your Case Atlas password.</p>
      ${emailButton(params.resetUrl, "Reset password")}
      <p style="margin: 16px 0 0; font-size: 13px; color: #8a8378;">
        This link expires in 30 minutes and can only be used once. If you didn&rsquo;t request
        this, you can safely ignore this email.
      </p>
    `,
  });
  return { subject, html };
}
