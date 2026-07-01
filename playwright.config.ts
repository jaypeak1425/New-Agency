import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium",
    },
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
