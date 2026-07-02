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
    // Never downgrade a live strategy's status on re-seed: "Approve & go
    // live" (docs/09 Path A) is a human sign-off recorded in the DB, and the
    // seed file always ships pending_content for the researched drafts. The
    // content fields still refresh in place.
    const { status, ...contentRefresh } = strategy;
    await prisma.strategy.upsert({
      where: { slug: strategy.slug },
      update: contentRefresh,
      create: strategy,
    });
    void status;
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
