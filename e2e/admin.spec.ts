import { test, expect, type Page, type Locator, type Browser } from "@playwright/test";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

// Waits for the mutation's POST to actually complete before doing anything
// else — clicking and immediately navigating away (even to reload the same
// page) can abort the in-flight request before the server processes it.
async function clickAdminAction(page: Page, row: Locator, buttonName: string) {
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().endsWith("/admin"),
    ),
    row.getByRole("button", { name: buttonName }).click(),
  ]);
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
}

// Each identity gets its own browser context (and therefore its own cookie
// jar) — pages from the same context share cookies, so logging in as a
// different user on another tab of the *admin's* context would silently
// clobber the admin's session.
async function newContextPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

async function loginAs(browser: Browser, email: string, password: string) {
  const page = await newContextPage(browser);
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  return page;
}

test("admin can suspend, reactivate, grant, and revoke a user's access", async ({ browser }) => {
  const targetEmail = uniqueEmail("admin-target");

  const setupPage = await newContextPage(browser);
  await setupPage.goto("/signup");
  await setupPage.waitForLoadState("networkidle");
  await setupPage.fill('input[name="name"]', "E2E Admin Target");
  await setupPage.fill('input[name="email"]', targetEmail);
  await setupPage.fill('input[name="password"]', "supersecret123");
  await setupPage.click('button[type="submit"]');
  await setupPage.waitForURL("**/billing");
  await setupPage.context().close();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const page = await loginAs(browser, adminEmail, adminPassword);
  await page.waitForURL("**/app");

  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  const row = page.locator(`tr:has-text("${targetEmail}")`);
  await expect(row).toContainText("active");

  await clickAdminAction(page, row, "Suspend");
  await expect(row).toContainText("suspended");

  const targetPage = await loginAs(browser, targetEmail, "supersecret123");
  await expect(targetPage.locator("main")).toContainText("suspended");
  await targetPage.context().close();

  await clickAdminAction(page, row, "Reactivate");
  await expect(row).toContainText("active");

  const targetPage2 = await loginAs(browser, targetEmail, "supersecret123");
  await targetPage2.waitForURL("**/billing");
  await targetPage2.context().close();

  await clickAdminAction(page, row, "Grant access");
  await expect(row).toContainText("comped");

  const targetPage3 = await loginAs(browser, targetEmail, "supersecret123");
  await targetPage3.waitForURL("**/onboarding");
  await targetPage3.click('button:has-text("Skip for now")');
  await targetPage3.waitForURL("**/app");
  await expect(targetPage3.locator("main")).toContainText("Dashboard");

  await clickAdminAction(page, row, "Revoke access");
  await expect(row.locator("td").nth(4)).toHaveText("canceled");

  // Revoking access downgrades the subscription — the user is still logged
  // in, just bounced to /billing again (a full suspend, tested above, is
  // what blocks login entirely).
  await targetPage3.goto("/app");
  await expect(targetPage3).toHaveURL(/\/billing/);
  await targetPage3.context().close();
  await page.context().close();
});
