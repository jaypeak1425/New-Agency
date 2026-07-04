// Slice 1 — trivial health check. Railway's healthcheckPath probes this to
// mark a deploy healthy. At this slice it only proves the Next server boots
// and serves — no database or SESSION_SECRET dependency yet. The real,
// stricter health check (DB reachability + SESSION_SECRET gate that fails
// the deploy on purpose) returns with the auth/database slice.
export function GET() {
  return Response.json({ status: "ok", slice: 1 });
}
