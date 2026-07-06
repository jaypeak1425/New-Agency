import { describe, it, expect } from "vitest";
import { welcomeEmail } from "@/lib/emails/welcome";
import { passwordResetEmail } from "@/lib/emails/password-reset";
import { billingAlertEmail } from "@/lib/emails/billing-alert";

describe("email templates", () => {
  it("welcome email greets the user by name and links to the dashboard", () => {
    const { subject, html } = welcomeEmail({ name: "Jay", appBaseUrl: "http://localhost:3000" });
    expect(subject).toContain("Welcome");
    expect(html).toContain("Hi Jay,");
    expect(html).toContain("http://localhost:3000/app");
    expect(html).toContain("Peakbritt Financial Group");
  });

  it("welcome email falls back to a generic greeting with no name", () => {
    const { html } = welcomeEmail({ name: null, appBaseUrl: "http://localhost:3000" });
    expect(html).toContain("Hi there,");
  });

  it("password reset email includes the reset link and expiry note", () => {
    const { subject, html } = passwordResetEmail({
      resetUrl: "http://localhost:3000/reset-password/abc123",
    });
    expect(subject).toContain("Reset your Case Atlas password");
    expect(html).toContain("http://localhost:3000/reset-password/abc123");
    expect(html).toContain("expires in 30 minutes");
  });

  it("billing alert varies subject and body by type", () => {
    const subscribed = billingAlertEmail({ type: "subscribed", appBaseUrl: "http://localhost:3000" });
    expect(subscribed.subject).toContain("subscribed");
    expect(subscribed.html).toContain("$297/month");

    const failed = billingAlertEmail({ type: "payment_failed", appBaseUrl: "http://localhost:3000" });
    expect(failed.subject).toContain("Action needed");
    expect(failed.html).toContain("payment");

    const canceled = billingAlertEmail({ type: "canceled", appBaseUrl: "http://localhost:3000" });
    expect(canceled.subject).toContain("ended");
    expect(canceled.html).toContain("canceled");
  });

  it("every template links to /billing or /app via the given app base URL", () => {
    const { html } = billingAlertEmail({ type: "subscribed", appBaseUrl: "https://app.example.com" });
    expect(html).toContain("https://app.example.com/billing");
  });
});
