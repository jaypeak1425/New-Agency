# 26 — Incremental Deploy Bring-Up (reusable playbook)

**Status: PROVEN (2026-07-04).** Ran end to end on Railway in 11 slices, every one green. It
pinned the real cause of the deploy failures to **infrastructure/config — not code, and not the
1.2 MB share images**: the Node `engines` pin, the `DATABASE_URL` reference, `SESSION_SECRET`, and
the Prisma engine fetch. Keep this method for any future deploy break, on any host. CLAUDE.md
records it as a locked decision.

## When to use it

The host (Railway, Fly, Render, Vercel, a container platform…) fails to deploy, but `npm run
build` is green locally. That combination means the cause is environment/build/infra, not a bug in
the code. This playbook isolates *which* infra thing, by bisection, with a human confirming the
host after each step.

## Why not "just split into 150 tiny commits"?

The host builds the **tip of the branch** — the final code state — regardless of how many commits
led there. Splitting the same final code into more commits produces the same build and the same
failure. Slicing only helps when each intermediate commit is a *different, smaller, deployable*
app, so a green→red transition pinpoints the culprit. That's the whole trick.

## The playbook (host-agnostic, ~8–12 slices)

1. **Tag the current app** as a restore point: `git tag full-app <current-sha>`. Every slice
   restores files *forward* from this tag, so the end state is byte-for-byte the original app.
2. **Slice 1 = bare skeleton** on the deploy branch: a landing page + a trivial health check that
   returns 200 with **no** database, auth, middleware, or heavy assets; start command with **no**
   migration step. This is the purest "can the host build and boot this toolchain" test. Keep
   real fonts/build-time-fetches in, since those are classic failures worth testing first.
3. **Each later slice restores one coherent layer** (`git checkout full-app -- <paths>`), tightening
   the start command and health check as the layer demands (DB → add `migrate deploy` + a DB
   check; auth → add the `SESSION_SECRET` gate). **Build locally to green before every push.**
4. **Hold known suspects to their own late slices** (big binary assets, SEO metadata files, the DB
   layer, Edge middleware) so a red deploy names them exactly.
5. **Push one slice, then STOP** and let a human confirm the host went green before the next. A
   green→red transition is your answer; fix that layer's config and continue.
6. **Restore all libraries/components in one early slice** once the skeleton is green — they're
   internally consistent and unused modules aren't evaluated at build, so later slices only add
   *routes* and you never chase a missing import.
7. **Final slice reaches parity** with `full-app`; `git diff full-app HEAD` should show only
   intentional keep-forever changes.

Ordering heuristic (riskiest infra first, cosmetics last): toolchain → database → session/edge
middleware → design-system + shell → feature routes in groups → marketing/SEO + big assets.

## Worked record — the 2026-07-04 Railway run

Full app preserved at tag **`full-app`** (commit `57c753e`); slices `c85a965`…`35e612a`. Prime
suspects that were isolated rather than assumed:

- `src/app/opengraph-image.png` and `src/app/twitter-image.png` — **1.2 MB each**, processed by
  Next as build-time metadata — held to the last slice. Verdict: **deployed fine** (not the cause).
- Second Google font (Montserrat) — kept in slice 1 so the build-time fetch was tested first. Fine.
- Prisma engine fetch / `DATABASE_URL` / migrations — isolated in slice 2. This layer + the env
  vars were the actual fix.

## Prime suspects spotted in the diff (to isolate, not assume)

- `src/app/opengraph-image.png` and `src/app/twitter-image.png` are **1.2 MB each**, placed where
  Next processes them as build-time metadata — isolated into the SEO/marketing slice.
- A second Google font (Montserrat) added — kept in the slice-1 skeleton layout so the build-time
  font fetch is tested from the very first deploy.
- Prisma engine fetch / `DATABASE_URL` / migrations — isolated into slice 2.

## Slice plan

| # | Slice | Adds | Proves |
|---|---|---|---|
| 1 | Bare skeleton | Landing + trivial `/api/health` (200, no DB); start command without migrate; no Prisma, middleware, SEO routes, or share images; Montserrat/Inter fonts kept | Railway can build & serve the Next 16 / Node 20 / Nixpacks toolchain + Google-font fetch |
| 2 | Database layer | Prisma schema + migrations + client, `postinstall: prisma generate`, `prisma migrate deploy` in start, DB-aware health check | Prisma engine fetch at build, `DATABASE_URL` reference, migrations, DB reachability |
| 3 | Auth + session | login/signup/reset, session lib, `SESSION_SECRET` health gate, middleware (`proxy.ts`) | `SESSION_SECRET` set; middleware bundles |
| 4 | App shell | Protected `/app` layout (mobile drawer), nav, dashboard welcome, design-system components, Wordmark/brand | Protected routing + design system |
| 5 | Brain | Strategy library seed (26), recommendations, hard rules, avatars | Seed + engine |
| 6 | Intake + recommendations UI | Intake, avatar/recommendation cards, Atlas reveal | Intake flow |
| 7 | Underwriting + handoff + math | Life/annuity intake, wholesaler handoff (+ quantified upside), commission/pipeline | Case design |
| 8 | Decks + CPA + tax + improvement | Pitch decks, CPA scrutiny, tax reference, agent quantified-improvement analysis | Client + agent output |
| 9 | Admin | Admin console, compliance queue, strategies admin, launch panel | Admin surface |
| 10 | Billing + IMO + ops + book import | Stripe, IMO white-label, master dashboard, nudges, sequence, book-of-business CSV import | Remaining app surface |
| 11 | Marketing + SEO + legal | Full landing, legal pages, robots/sitemap/llms.txt, **the two 1.2 MB share images**, marketing footer | Full parity with `full-app` |

Notes:
- The table is the *plan*. The actual run applied playbook step 6: **slice 4 restored all 48 libs +
  17 components at once**, so slices 5–11 added only routes (scenarios, then agent tools, admin,
  billing/portals, marketing/SEO) and never chased a missing import. Same destination, fewer stalls.
- Slice 1 excludes `tests`, `e2e`, `scripts` from the **build** type-check (they aren't part of the
  deployed bundle and are exercised by vitest/playwright/seed separately). Keep-forever improvement.
- The start command and health check tighten as the DB and auth return (slices 2–3), matching the
  phased runbook in docs/24.
- Sandbox note: mid-run, this repo's local git mirror rolled back to a pre-slice snapshot, but the
  real GitHub branch retained every slice (verified via the GitHub API) and Railway deploys from
  there — so the deploy was never affected. If the local `origin` ref looks stale, `git fetch` (the
  proxy forwards to real GitHub) and reset to `origin/<branch>` before continuing.
