import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Slice 2 — DB-aware health check. Proves the database layer end to end:
// prisma generate at build, `prisma migrate deploy` in the start command,
// the DATABASE_URL reference, and live connectivity. If this deploy goes
// red, the database layer (not app code) is the cause. The SESSION_SECRET
// gate returns with the auth slice, so this slice isolates the DB alone.
export async function GET() {
  let db = "connected";
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "unreachable";
    dbOk = false;
  }
  return NextResponse.json({ status: dbOk ? "ok" : "error", db, slice: 2 }, { status: dbOk ? 200 : 503 });
}
