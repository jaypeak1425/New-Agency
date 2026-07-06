import { test, expect } from "@playwright/test";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test("new user without a subscription is gated to /billing, admin bypasses it", async ({
  page,
}) => {
  const email = uniqueEmail("billing");
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="name"]', "E2E Billing");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supersecret123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/billing");
  await expect(page.locator("main")).toContainText("Billing");

  await page.context().clearCookies();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app");
  await expect(page.locator("main")).toContainText("Dashboard");
});
