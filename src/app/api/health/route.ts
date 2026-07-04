import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Railway's deploy health check (railway.json healthcheckPath). Fails — and
// therefore rolls the deploy back — when either of the two things every
// request path depends on is missing: the database and the session-signing
// secret. Anything less critical (Stripe, email) degrades gracefully and is
// reported on /admin/launch instead; this endpoint is public, so it only
// exposes booleans, never values or error internals.
export async function GET() {
  const sessionSecret = Boolean(process.env.SESSION_SECRET);

  let db = "connected";
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "unreachable";
    dbOk = false;
  }

  const ok = dbOk && sessionSecret;
  return NextResponse.json(
    { status: ok ? "ok" : "error", db, sessionSecret },
    { status: ok ? 200 : 503 },
  );
}
