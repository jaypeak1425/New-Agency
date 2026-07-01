import { execFileSync } from "child_process";
import path from "path";

// Runs via tsx as a separate process rather than importing the Prisma client
// directly: Playwright's own TS loader for config/teardown files can't handle
// the generated client's `import.meta` usage, but tsx (used everywhere else
// in this project for one-off scripts) handles it fine.
export default function globalTeardown() {
  execFileSync("npx", ["tsx", path.join(__dirname, "../scripts/e2e-cleanup.ts")], {
    stdio: "inherit",
  });
}
