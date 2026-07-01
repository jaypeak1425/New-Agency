# Phase 1 — The Skeleton · Claude Code session prompts

Milestone: "We have an app." Run these as separate sessions, in order. One session = one user
story. Each ends with its own test. Read `/CLAUDE.md` and `/docs/00-developer-brief.md` first.

Stack: Next.js (App Router) + TypeScript · Supabase (Postgres) · Stripe · deploy Railway.

---

## Session 1 — Scaffold + schema + deploy
**Goal:** Empty Next.js app running on a Railway staging URL, with the database schema and the
audit-log spine in place.
**In scope:** Next.js + TS project; Tailwind; Supabase client; Prisma (or Supabase migrations);
schema for `users`, `subscriptions`, `admin_actions`, `audit_log`, `scenarios` (stub);
health-check route; Railway deploy config; `.env.example`.
**Constraints:** No business logic yet. `audit_log(id, actor_id, action, target, metadata jsonb,
created_at)` is required now. Secrets only via env.
**Done when:** `npm run dev` works locally; app deploys to a Railway URL; migrations apply; a seed
script inserts one admin user.

## Session 2 — Auth (signup / login / reset)
**Goal:** Email+password auth with forgot-password reset.
**In scope:** signup, login, logout, password hashing, session management, forgot-password email
flow, minimal unstyled pages.
**Constraints:** Auth required for `/app/*`. Log signups to `audit_log`. No branding yet.
**Done when:** a user can sign up, log in, reset password, log out; sessions persist; protected
routes redirect when logged out.

## Session 3 — Empty dashboard + protected routing
**Goal:** A logged-in user sees an empty dashboard shell with nav; unauth users can't reach it.
**In scope:** `/app` layout, nav placeholder, empty-state dashboard, route guards.
**Constraints:** Placeholder copy only (no brand). Structure nav for later: Scenarios, Pipeline,
Prospects, Settings.
**Done when:** login lands on the dashboard; logout returns to marketing/login; guards enforced.

## Session 4 — Stripe billing at $97/mo (test mode)
**Goal:** A user subscribes at $97/mo and gains access.
**In scope:** Stripe Checkout for a $97/mo product; customer portal link; gate `/app/*` on active
subscription; store `subscriptions` row.
**Constraints:** Test keys via env. No annual/IMO pricing yet (Phase 5). Do not auto-send anything.
**Done when:** test card subscribes; access granted; portal opens; canceling revokes access.

## Session 5 — Admin console + access control
**Goal:** An admin can see all users and grant/revoke/suspend access.
**In scope:** `/admin` (admin-role only); user list with plan+status; grant/revoke/suspend actions;
write every action to `audit_log`.
**Constraints:** Admin routes require admin role. Every mutation is audited (actor, target, ts).
**Done when:** admin logs in, lists users, suspends one (that user loses access), reactivates;
audit_log shows all three.

## Session 6 — Stripe webhooks (subscription lifecycle)
**Goal:** Subscription state stays correct without manual touch.
**In scope:** webhook endpoint handling `checkout.session.completed`,
`customer.subscription.updated/deleted`, `invoice.payment_failed`; idempotency; update
`subscriptions`; audit each event.
**Constraints:** Verify signatures. Idempotent on retries.
**Done when:** simulated events update state correctly; payment-failed marks past_due; deletion
revokes access.

## Session 7 — End-to-end test + auth UX polish
**Goal:** The full Phase 1 loop is solid.
**In scope:** happy-path e2e (signup→pay→login→dashboard→logout); admin actions test; error states;
loading states; basic security pass (HTTPS assumed via Railway, secure cookies, no secrets in
client).
**Done when:** the Phase 1 definition-of-done in `/CLAUDE.md` passes end to end on staging.

---

### Parallel track (can run anytime — no Brain dependency)
These are pure logic and drop into Phase 3 later. Build as standalone, unit-tested modules.

**Session A — Compliance filter module.** `complianceFilter(text) → {status: pass|rewrite|hold,
output, violations[]}`. Rules from `/CLAUDE.md`. Full unit tests over the banned-language list
("tax-free"→"non-taxable", guarantees, income claims, form numbers, Firm Advantage, missing
"while the policy remains in force").

**Session B — 9-hard-rules module.** `checkHardRules(recommendation) → {allowed, violations[]}`.
Encode all 9. Unit-test each (esp. #1 direct annuity→life must fail and suggest the SPIA bridge).
