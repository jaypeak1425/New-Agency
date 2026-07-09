import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDueSequenceSends, SequenceError } from "@/lib/sequence";

// Scheduled sender for the docs/15 email sequence (vercel.json cron). The
// sequence engine requires an admin actor for auditability, so the cron runs
// as the first admin account. Auth: Vercel cron sends
// `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set — reject
// everything else so the endpoint can't be triggered publicly.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) {
    return NextResponse.json({ error: "No admin account exists" }, { status: 500 });
  }

  try {
    const result = await processDueSequenceSends(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof SequenceError ? error.message : "Send run failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
