import { emailShell, emailButton } from "./shell";

export type BillingAlertType = "subscribed" | "payment_failed" | "canceled";

const COPY: Record<BillingAlertType, { subject: string; preheader: string; body: string }> = {
  subscribed: {
    subject: "You're subscribed to Case Atlas",
    preheader: "Your $97/month subscription is active.",
    body: `
      <p style="margin: 0 0 16px;">Your Case Atlas subscription is active — $97/month.</p>
      <p style="margin: 0 0 16px;">
        Run your first &ldquo;I&rsquo;ve got a guy&rdquo; scenario tonight. See what&rsquo;s
        sitting in your book.
      </p>
    `,
  },
  payment_failed: {
    subject: "Action needed: your Case Atlas payment failed",
    preheader: "We couldn't process your latest payment.",
    body: `
      <p style="margin: 0 0 16px;">
        We weren&rsquo;t able to process your latest Case Atlas payment. Your access stays
        active for now, but please update your billing details to avoid an interruption.
      </p>
    `,
  },
  canceled: {
    subject: "Your Case Atlas subscription has ended",
    preheader: "Your subscription is now canceled.",
    body: `
      <p style="margin: 0 0 16px;">
        Your Case Atlas subscription has been canceled. You can resubscribe any time — your
        account and data are still here.
      </p>
    `,
  },
};

export function billingAlertEmail(params: { type: BillingAlertType; appBaseUrl: string }) {
  const { subject, preheader, body } = COPY[params.type];
  const html = emailShell({
    preheader,
    bodyHtml: `
      ${body}
      ${emailButton(`${params.appBaseUrl}/billing`, "Manage billing")}
    `,
  });
  return { subject, html };
}
