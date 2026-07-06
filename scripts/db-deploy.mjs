// Conditional DB provisioning for serverless builds (Vercel).
//
// The build must migrate + seed when a database is configured, but a missing
// DATABASE_URL must NOT kill the whole deploy — the marketing surface works
// without a database, and blocking it left the production site pinned to an
// old commit. When the variable is absent we warn loudly and continue; the
// moment DATABASE_URL is set in Vercel, the next deploy provisions the full
// database (all migrations + idempotent seed) automatically.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn(
    "\n[db-deploy] DATABASE_URL is not set — skipping `prisma migrate deploy` and seed.\n" +
      "[db-deploy] The site will build, but app features that need the database will not work\n" +
      "[db-deploy] until DATABASE_URL (and SESSION_SECRET) are configured and the project is redeployed.\n",
  );
  process.exit(0);
}

const run = (cmd) => {
  console.log(`[db-deploy] ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");
