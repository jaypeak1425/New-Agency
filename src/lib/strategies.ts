import { prisma } from "@/lib/prisma";

// Brain Lock (CLAUDE.md): the recommendation engine may only ever surface
// `documented` strategies to an agent. `pending_content` rows exist purely
// as a roster placeholder until the real brain doc content is supplied.
export async function listDocumentedStrategies() {
  return prisma.strategy.findMany({
    where: { status: "documented" },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });
}

export async function listAllStrategiesForAdmin() {
  return prisma.strategy.findMany({
    orderBy: [{ tier: "asc" }, { status: "asc" }, { name: "asc" }],
  });
}
