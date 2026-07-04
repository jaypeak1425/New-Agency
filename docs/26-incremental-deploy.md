# 26 — Incremental Railway Bring-Up

Railway was failing to deploy the full app. The local production build is green every time, which
points at Railway environment/build/infra rather than the code. To isolate the exact cause, we
rebuild the app on the deploy branch (`claude/new-session-ollg4p`, which Railway auto-deploys) from
a bare skeleton upward, in verifiable slices. Each slice is a complete, independently-buildable
app; after each push we pause for a human to confirm Railway went green before adding the next.
Whichever slice turns Railway red is the exact thing to fix.

The full pre-existing app is preserved at tag **`full-app`** (commit `57c753e`) — every slice
restores files forward from it, so the endpoint of this process is byte-for-byte the original app.

## Why not "150 tiny commits"?

Railway builds the tip of the branch — the final code state — regardless of how many commits led
there. Splitting the same final code into more commits produces the same build and the same
failure. Slicing only helps when each intermediate commit is a *different, smaller, deployable*
app, so a green→red transition pinpoints the culprit. That's what this plan does.

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
- Slice 1 excludes `tests`, `e2e`, `scripts` from the **build** type-check (they aren't part of the
  deployed bundle and are exercised by vitest/playwright/seed separately). Keep-forever improvement.
- The start command and health check tighten as the DB and auth return (slices 2–3), matching the
  phased runbook in docs/24.
