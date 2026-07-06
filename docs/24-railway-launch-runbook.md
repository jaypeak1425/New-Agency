# Railway Launch Runbook — Phased Rollout

How to take Case Atlas live on Railway in phases. Each phase is independently shippable: the app
boots and degrades gracefully with partial configuration, and **`/admin/launch` shows this exact
checklist against the live deployment's real configuration** — use it as the source of truth for
where you are.

The phases map to the business plan's timeline (docs/20-business-plan.md): months 1-3 are comped
design partners (no payments), soft launch converts them to paid, then outreach, then IMOs.

---

## Phase A — Pilot (design partners, no payments)

**Goal:** the app is live on a URL, the Brain is seeded, you and 2-3 design partners are using it.
Access is comped from the admin console — no Stripe involved.

1. **Create the Railway project** from the GitHub repo (already done if you're resuming the earlier
   attempt). The repo already carries the two config files Railway needs:
   - `railway.json` — Nixpacks build, `prisma migrate deploy && npm run start` start command,
     health check at `/api/health`.
   - `package.json` `engines` — pins Node ≥ 20.19 (the first deploy failure: Nixpacks defaulted to
     Node 18, which Prisma 7 refuses).
2. **Add Postgres**: in the project, `+ New → Database → PostgreSQL`. Then on the app service →
   Variables, add a reference variable `DATABASE_URL` → select the Postgres service's
   `DATABASE_URL`. (The second-deploy failure mode: without this, `prisma migrate deploy` in the
   start command dies immediately and the deploy loops.)
3. **Set the required variables** on the app service:
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`. The health check **fails the
     deploy on purpose** if this is missing, so Railway rolls back rather than shipping an app
     where every login crashes.
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — your real admin login. Set these **before**
     seeding so the production database never contains the `admin@example.com` / `changeme123`
     defaults.
4. **Deploy** (push to the connected branch or hit Deploy). Wait for the health check to go green.
5. **Expose the service**: Settings → Networking → Generate Domain. (This was the "Unexposed
   service" from the earlier attempt — a green deploy still has no public URL until this step.)
6. **Set `APP_BASE_URL`** to the generated domain (e.g. `https://case-atlas-production.up.railway.app`)
   and redeploy. Links in emails and Stripe redirects use it; without it the app falls back to the
   request host, which works but is less predictable.
7. **Seed the database** (one-off command, idempotent — safe to re-run):
   ```
   railway run npm run db:seed
   ```
   This creates the admin account and the 17-strategy library (10 documented, 7 pending content).
8. **Verify**: open `/admin/launch` as the admin — Phase A should be fully green. Then run the
   smoke test: signup as a test agent → grant access from `/admin` → run an "I've got a guy"
   intake → see a recommendation.
9. **Onboard design partners**: they sign up at `/signup`, you grant access from `/admin`
   (creates a `comped` subscription — $0 MRR by design, the master dashboard excludes comps from
   revenue). Assign each a wholesaler if they have one.

**Known Phase A limitation:** emails (welcome, password reset, wholesaler/IMO invites) print to
the **deploy logs** instead of sending — no email provider is wired up yet (Phase C). To complete
a wholesaler or IMO-principal invite, copy the reset link out of the Railway logs and send it
yourself.

---

## Phase B — Paid launch ($297/mo self-serve)

**Goal:** the billing page switches from pilot mode to live Stripe checkout. Until every item here
is set, the billing page shows pilot copy instead of subscribe buttons — flipping this phase on is
purely additive.

1. In Stripe (test mode first):
   - Create a product "Case Atlas" with a **$297/month** recurring price → copy the price id into
     `STRIPE_PRICE_ID_AGENT_MONTHLY`.
   - Optionally create the **$2,970/year** price → `STRIPE_PRICE_ID_AGENT_ANNUAL`. The annual
     button only appears once this is set.
   - Copy the API secret key → `STRIPE_SECRET_KEY`.
2. **Webhook endpoint**: Stripe Dashboard → Developers → Webhooks → Add endpoint →
   `https://<your-domain>/api/webhooks/stripe`, subscribed to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
   Copy the signing secret → `STRIPE_WEBHOOK_SECRET`. Without this, checkout still works but
   renewals/cancellations/payment failures never reach the app.
3. Redeploy, then run a full test-mode checkout (card `4242 4242 4242 4242`): subscribe → land on
   `/billing/success` → dashboard unlocked → cancel from the billing portal → access revoked.
4. Swap the three Stripe variables to live-mode values when ready to take real money.

---

## Phase C — Outreach & comms (emails actually deliver)

**Goal:** invites, password resets, billing alerts, and the docs/15 email sequence really send.

1. Pick a provider (Resend, Postmark, SES…) and replace the body of `sendEmail` in
   `src/lib/email.ts` and `src/lib/sequence.ts` — every template already renders final HTML, so
   this is a transport swap, not a rewrite. Flip `isEmailDeliveryConfigured()` in
   `src/lib/launch.ts` to check the provider's env var so `/admin/launch` tracks it honestly.
2. The email sequence has **no scheduler** — an admin presses "Send due sequence emails" on
   `/admin`. If you want it automatic, add a Railway cron service hitting a small authenticated
   endpoint, or run `railway run` on a schedule. Same applies to the weekly call queue (lazily
   generated) and the compliance periodic audit (admin-triggered) — both are fine without cron,
   just not push-based.

---

## Jarvis layer — conversational "I've got a guy" intake

**Goal:** the agent types a paragraph and Atlas fills in the intake. One variable, any phase:

1. Set `ANTHROPIC_API_KEY` on the app service and redeploy. That's it — the "Tell Atlas" box
   appears on the intake page. Without the key, the structured 10-question form works exactly as
   before and the box is replaced by a note.
2. How it stays honest: the model's only job is extraction. Everything it returns passes a
   whitelist validator (`src/lib/intake-parser.ts`) that drops any value outside the schema's own
   enums, so a hallucinated answer can never reach the database; the agent reviews the pre-filled
   form before saving; each parse is audit-logged with exactly which fields it filled. Strategy
   selection stays 100% in the deterministic engine (Brain Lock).
3. Model routing is CLAUDE.md's locked `callModel(complexity, messages)`: Haiku for simple tasks,
   Sonnet for complex (the parser uses complex). Override with `AI_MODEL_SIMPLE` /
   `AI_MODEL_COMPLEX` if needed. Voice input still needs speech-to-text — not built.

---

## Phase D — IMO white-label

**Goal:** first IMO contract live. No new environment variables — this phase is operational:

1. Create the IMO on `/admin/imos` (seats, contract terms), set branding (logo URL, accent color,
   byline — logos are hosted URLs; there's no upload storage yet), seat the agents, create the
   principal login (invite link is in the deploy logs until Phase C).
2. The principal portal is `/imo-principal`; seat changes are logged to the audit log for manual
   invoicing — there's no automated IMO billing.

---

## Standing gaps that are *not* deployment blockers

Documented throughout docs/01-phased-build-plan.md; none stop a Phase A-D launch:
brain-doc content for the 7 `pending_content` strategies · AI backend for free-text intake ·
pitch-deck & video-recommender content · object storage for logo uploads · a cron/job runner ·
help-doc copy · the launch commercial.

---

## Quick reference — variables by phase

| Variable | Phase | Required? |
|---|---|---|
| `DATABASE_URL` | A | Yes (reference the Railway Postgres service) |
| `SESSION_SECRET` | A | Yes (health check fails without it) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | A | Yes, before first seed |
| `APP_BASE_URL` | A | Strongly recommended once the domain exists |
| `STRIPE_SECRET_KEY` | B | Yes for paid launch |
| `STRIPE_PRICE_ID_AGENT_MONTHLY` | B | Yes for paid launch |
| `STRIPE_WEBHOOK_SECRET` | B | Yes for subscription lifecycle |
| `STRIPE_PRICE_ID_AGENT_ANNUAL` | B | Optional (enables the annual button) |
| Email provider key | C | When switching off the dev logger |
| `ANTHROPIC_API_KEY` | Any | Optional — enables free-text "I've got a guy" parsing |

*Last updated: July 2, 2026.*
