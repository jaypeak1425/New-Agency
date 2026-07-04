import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { strategyLibrarySeed } from "./strategy-library-data";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", status: "active" },
    create: {
      email,
      passwordHash,
      name: "Admin",
      role: "admin",
      status: "active",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "seed.admin_created",
      target: admin.id,
      metadata: { email },
    },
  });

  console.log(`Seeded admin user: ${email}`);

  for (const strategy of strategyLibrarySeed) {
    // Status is a one-way street on re-seed: the seed may PROMOTE a strategy
    // to documented (it carries the owner's recorded sign-off — see the
    // 2026-07-02 approval note in strategy-library-data.ts) but never
    // downgrades one that's already live, since "Approve & go live"
    // (docs/09 Path A) sign-offs live in the DB. Content refreshes in place
    // either way.
    const { status, ...contentRefresh } = strategy;
    const existing = await prisma.strategy.findUnique({ where: { slug: strategy.slug } });
    const promoting = existing?.status === "pending_content" && status === "documented";
    const row = await prisma.strategy.upsert({
      where: { slug: strategy.slug },
      update: promoting ? strategy : contentRefresh,
      create: strategy,
    });
    if (promoting) {
      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "strategy.approved_live",
          target: row.id,
          metadata: {
            slug: strategy.slug,
            name: strategy.name,
            via: "seed promotion — owner sign-off recorded in prisma/strategy-library-data.ts (docs/09 Path A)",
          },
        },
      });
      console.log(`Promoted to documented (owner sign-off): ${strategy.slug}`);
    }
  }

  console.log(`Seeded strategy library: ${strategyLibrarySeed.length} strategies`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
