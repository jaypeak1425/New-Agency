import { emailShell, emailButton } from "./shell";
import type { HandoffContent } from "@/lib/handoff";

function section(title: string, lines: string[]) {
  if (lines.length === 0) return "";
  return `
    <p style="margin: 16px 0 4px; font-weight: bold; color: #1a2332;">${title}</p>
    <p style="margin: 0 0 8px; white-space: pre-line;">${lines.join("<br />")}</p>
  `;
}

export function wholesalerCaseNotificationEmail(params: {
  wholesalerName?: string | null;
  agentName: string;
  caseLabel: string;
  portalUrl: string;
  handoffContent?: HandoffContent;
}) {
  const greeting = params.wholesalerName ? `Hi ${params.wholesalerName},` : "Hi there,";
  const subject = `Illustration request — ${params.caseLabel}`;
  const { handoffContent } = params;

  const handoffHtml = handoffContent
    ? `
      ${section("Strategy requested", handoffContent.strategyRequestedLines)}
      ${section("Client profile", handoffContent.clientProfileLines)}
      ${section("Business context", handoffContent.businessContextLines)}
      ${section("Scenario summary", handoffContent.scenarioSummaryLines)}
      ${section("COI notes", handoffContent.coiNotes)}
      ${section("CPA readiness — documentation this case will need", handoffContent.documentationLines)}
      ${section("Quantified upside (agent-only — federal, directional)", handoffContent.improvementLines)}
      <p style="margin: 16px 0 4px; font-weight: bold; color: #1a2332;">Compliance note</p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #8a8378;">${handoffContent.complianceNote}</p>
      ${section("Agent contact", handoffContent.agentContactLines)}
    `
    : `
      <p style="margin: 0 0 16px;">
        <strong>${params.agentName}</strong> is working a case with you: <strong>${params.caseLabel}</strong>.
      </p>
    `;

  const html = emailShell({
    preheader: `${params.agentName} sent an illustration request for "${params.caseLabel}".`,
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        <strong>${params.agentName}</strong> sent an illustration request — the case design and
        client profile are below so you can pre-quote without re-asking the basics.
      </p>
      ${handoffHtml}
      ${emailButton(params.portalUrl, "Open your portal")}
    `,
  });
  return { subject, html };
}
