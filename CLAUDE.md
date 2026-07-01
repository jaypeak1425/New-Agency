# CLAUDE.md — Insurance Strategy Engine (Case Atlas)

This file is read by Claude Code on every session. It is the standing context for the build.
Keep it current. When something is locked, record it here so it is not re-litigated.

---

## What we are building

One integrated SaaS for life-insurance & annuity producers. A producer types a plain-language
client scenario ("I've got a guy…"), the in-app assistant **Atlas** runs a 10-question intake,
classifies the prospect into avatars, recommends strategies from a **locked strategy library
(the Brain)**, decides life vs. annuity vs. hybrid, surfaces COI actions, drafts a wholesaler
handoff email, builds a pitch deck, and tracks pipeline. Sold direct at **$97/mo**; later
white-labeled to IMOs at **$75/seat**.

"Atlas typer" = the in-app "I've got a guy" intake feature. It is native to THIS product (not a
separate portal).

## Locked decisions (do not re-litigate)

- **Stack:** Next.js (App Router) + TypeScript · Supabase (Postgres, Auth optional) · Stripe ·
  deploy to **Railway**. Build host-agnostic; Railway is the target.
- **AI:** routed by complexity — simple tasks → cheap/fast model, complex → capable model.
  Single provider abstraction; model choice behind one `callModel(complexity, messages)` function.
- **Pricing:** $97/mo direct (Phase 1). Annual (~$970–980) and IMO per-seat ($75) come in Phase 5.
- **Names — locked:** Agency = **Peakbritt Financial Group**. Software = **Case Atlas**. Bot = **Atlas**.
- **Build method:** one Copilot/Claude-Code session = one user story = 5–10 related changes. State
  goal, files in scope, constraints, definition of done up front.

## The 6-phase plan (canonical — from the Master Developer Brief)

1. **Skeleton** — app, auth, Stripe $97/mo, admin controls, audit log, empty dashboard.
2. **Brand** — design system, marketing site, onboarding, branded UI/emails.
3. **Brain** — strategy library ingested; 10-question intake; avatar classify; recommend; pivot;
   compliance filter; 9 hard rules; life+annuity UW intake; wholesaler-handoff trigger.
4. **Output** — pitch decks, commission/pipeline math, book-of-business calc, prospecting list,
   weekly call queue, video recommender.
5. **Operations** — master dashboard, Opportunity Flow + Learning Loop, compliance queue, annual +
   IMO tiers, white-label engine.
6. **Polish** — iPhone-moment polish, nudges, email-sequence integration, launch commercial.

Test end-to-end at the end of every phase before moving on.

## Cross-cutting rules — enforce in ALL phases

### The 9 non-negotiable hard rules (engine-level enforcement, not just docs)
1. Direct annuity→life §1035 is NEVER valid — must route through a SPIA bridge (SPIA income funds
   life premiums inside an ILIT, trust as original owner).
2. §1035 is for non-qualified contracts only — qualified money uses rollover/transfer rules.
3. Life→life §1035 requires same insured AND same owner.
4. ILIT must be the original owner to avoid the §2035 3-year lookback.
5. COLI requires §101(j) notice and consent BEFORE issue.
6. MEC status is irrevocable once triggered.
7. §162 executive bonus must qualify as reasonable compensation.
8. A spouse's IRA cannot fund joint LTC benefits — prohibited transaction.
9. §415(b) limits apply to life insurance inside qualified plans.

### The 3-layer guardrail
- **Compliance filter** (runtime, every client-facing output): "non-taxable" never "tax-free";
  condition claims "while the policy remains in force"; no outcome quantification; no IRS form
  numbers or repositioning-structure names in client copy; no "Firm Advantage"/CPA-on-staff; no
  guarantees / specific income claims. Output = pass | rewrite | hold-for-review.
- **Brain lock:** recommend ONLY from the locked strategy library. No AI invention. New strategies
  enter via the Pre-Launch Validation workflow (Phase 5).
- **Client-profile filter:** check age, health, structure, time horizon, ownership % before
  recommending; pivot-to-alternative when the primary fails a gate.

### Auditability
Every gate check, pivot, recommendation, handoff, admin action, and compliance event is logged to
`audit_log` with timestamp + actor + input snapshot. This log is the substrate for the Phase 5
Learning Loop. Treat it as a first-class feature from Phase 1.

## Numeric defaults (override via config; source of truth = Progress Dashboard Math doc)

- Commission Y1: permanent/survivorship/§162 = 55%; term/DI/LTC = 50%; annuity = 2%; COLI = 0.5%
  of face. (Normalize all doc inconsistencies to these.)
- Close rates: existing/strong 40% · existing prospect 1st mtg 25% · 2nd mtg 40% · cold 1st 15% ·
  cold 2nd 30% · warm referral 35%.
- Book-of-business addressable filter: 15%.
- Per-avatar Y1 commission model: BO w/ co-owners $35k · BO solo $12k · HNW $8k · Qualified-Fund
  $6k · Family/Legacy $2.5k.

## The 4 avatars
HNW ($2M+ net worth) · Business Owner (entity + employees) · Qualified-Fund-Heavy ($500K+
qualified) · Family/Legacy (dependents / legacy intent). Prospects usually stack multiple; priority
order BO → HNW → QFH → Family/Legacy. $500K–$1.5M earners get an OBBBA AMT-trap diagnostic flag.

## Docs
Full source specs live in `/docs`. Read `/docs/00-developer-brief.md` first, then the phase you are
working. Do not invent behavior that contradicts a doc; if a doc is silent, ask.

## Definition of done for Phase 1
See `/phase-1-sessions/`. Ship: signup → pay $97/mo (Stripe test) → login → empty dashboard →
logout; admin can grant/revoke/suspend; Stripe webhooks handle create/cancel/payment-failed; all
routes secured; deployed to a Railway staging URL; `audit_log` capturing admin actions.
