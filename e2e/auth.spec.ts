import { test, expect } from "@playwright/test";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test("unauthenticated /app redirects to /login with next param", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
});

test("signup creates a session and lands on billing (no subscription yet)", async ({ page }) => {
  const email = uniqueEmail("signup");
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="name"]', "E2E Signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supersecret123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/billing");
  await expect(page.locator("main")).toContainText("Subscribe for $97/month");
});

test("logging out from the dashboard clears the session and blocks /app again", async ({
  page,
}) => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app");
  await page.waitForLoadState("networkidle");

  await page.click('nav button[type="submit"]');
  await page.waitForURL("**/login");

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("wrong password shows an error and correct password logs in", async ({ page }) => {
  const email = uniqueEmail("login");
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="name"]', "E2E Login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supersecret123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/billing");

  await page.context().clearCookies();

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "wrongpassword");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/login\?error=/);
  await expect(page.locator("main")).toContainText("Invalid email or password");

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supersecret123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/billing");
});

test("forgot password issues a single-use reset link", async ({ page }) => {
  const email = uniqueEmail("reset");
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="name"]', "E2E Reset");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supersecret123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/billing");

  await page.context().clearCookies();

  await page.goto("/forgot-password");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/forgot-password\?sent=1/);
  await expect(page.locator("main")).toContainText("a reset link has been sent");
});
