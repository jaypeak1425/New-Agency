import { emailShell, emailButton } from "./shell";

export function wholesalerCaseNotificationEmail(params: {
  wholesalerName?: string | null;
  agentName: string;
  caseLabel: string;
  portalUrl: string;
}) {
  const greeting = params.wholesalerName ? `Hi ${params.wholesalerName},` : "Hi there,";
  const subject = `${params.agentName} is working a case with you`;
  const html = emailShell({
    preheader: `${params.agentName} is working "${params.caseLabel}" — take a look and give them a call.`,
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        <strong>${params.agentName}</strong> is working a case with you: <strong>${params.caseLabel}</strong>.
      </p>
      <p style="margin: 0 0 16px;">
        Take a look in your portal and give them a call to talk it through.
      </p>
      ${emailButton(params.portalUrl, "Open your portal")}
    `,
  });
  return { subject, html };
}
