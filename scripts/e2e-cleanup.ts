import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ where: { email: { startsWith: "e2e-" } } });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await prisma.adminAction.deleteMany({
      where: { OR: [{ adminId: { in: ids } }, { targetUserId: { in: ids } }] },
    });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  console.log(`e2e cleanup: removed ${ids.length} test user(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
