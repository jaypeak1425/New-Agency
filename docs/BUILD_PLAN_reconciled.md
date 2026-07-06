# Insurance Strategy Engine ("Atlas" / Case Atlas) — Reconciled Build Map

**What this is:** One organized index of all 22 package documents, mapped to the canonical
6-phase build plan (from the Master Developer Brief), with an explicit statement of **what I can
build for you now** versus **what needs you or a dev** at each phase.

**Spine:** I am using the package's own 6-phase plan (Skeleton → Brand → Brain → Output →
Operations → Polish). This supersedes the 10-phase draft I made earlier before the canonical
docs arrived.

**Last updated:** July 2026

---

## A. The document set, organized (22 docs)

**Group 1 — Meta / read-first (the map)**
- Master Developer Brief — architecture, 9 hard rules, guardrails, 6 phases *(read first)*
- Phased Build Plan — the 6 phases with Copilot batching + end-of-phase tests
- Product Build Status — working index, what's locked, open questions
- Final Handoff Document — reading order, launch checklist, open questions for Jay/Luke
- Business Plan & P&L — pricing, path to $30K MRR, cost lines

**Group 2 — The engine core (Phases 3–4)**
- The Brain *(strategy library — NOT yet uploaded; the one true dependency)*
- "I've Got a Guy" Intake Flow — 10-question state machine, avatar classify, recommend, pivot
- Field Underwriting Questionnaire — Life (12Q) + Annuity (9Q), eligibility gates
- The 2-Product Universe — life/annuity/hybrid decision tree (6 gates), pivots, hybrid sequencer
- Wholesaler Handoff Template — email engine, variations A–D, commission math, quality checks
- Progress Dashboard Math — commission/close-rate/pipeline/book-of-business formulas
- Advanced Case Design Framework *(built earlier — seeds the advanced-trust strategy records)*

**Group 3 — Operations / dashboards (Phase 5)**
- Master Dashboard Spec — team command center, Opportunity Flow + Learning Loop, compliance queue
- Pre-Launch Validation Process — 9-step strategy-onboarding workflow, 12 diagnostic questions

**Group 4 — Brand & marketing (Phases 2 & 6, plus GTM)**
- Brand Package — names, taglines, palette, voice, brand-rules checklist
- Sales Page · Three Pitch Decks · IMO One-Pager · Launch Commercial Script · 5–7 Email Sequence
- Recruiting Engine Spec — funnels, channels, KPIs
- Dream 100 (framework + 2 populated lists) — IMO outreach

---

## B. Cross-cutting rules (enforced in every phase — from the Brief)

- **9 hard rules** (engine-level, not documentation): no direct annuity→life §1035 (SPIA bridge
  mandatory); §1035 = non-qualified only; life→life §1035 same insured+owner; ILIT original owner
  (§2035); COLI needs §101(j) notice+consent; MEC irrevocable; §162 = reasonable comp; spouse IRA
  ≠ joint LTC; §415(b) limits on life in qualified plans.
- **3-layer guardrail:** compliance filter → brain lock (recommend only from locked library, no
  invention) → client-profile filter (age/health/structure/time/ownership before recommending).
- **Compliance language:** "non-taxable" never "tax-free"; condition claims "while the policy
  remains in force"; no outcome quantification; no IRS form numbers / structure names in client
  copy; no "Firm Advantage" / CPA-on-staff; no guarantees.
- **Everything auditable:** every gate, pivot, recommendation, handoff, admin action, compliance
  event logged with timestamp + actor. This log is the substrate for the Phase 5 Learning Loop.

---

## C. The 6 phases — what I can build, per phase

Legend: **[Claude]** = I can produce this here as real code/artifacts · **[You/Dev]** = human,
infra, or credential action · **[Blocked]** = needs an input you haven't provided yet.

### Phase 1 — The Skeleton · "We have an app."
- **[Claude]** Next.js + TypeScript scaffold; Postgres/Supabase schema (users, subscriptions,
  admin_actions, scenarios, audit_log); auth (signup/login/forgot-password); protected routing;
  admin grant/revoke/suspend; Stripe subscription wiring + webhook handlers (test-mode, code only);
  empty dashboard shell.
- **[You/Dev]** Real Stripe keys, domain, staging deploy, env secrets.
- **Done when:** signup → pay → login → empty dashboard → logout; admin can suspend; webhooks
  handle create/cancel/payment-failed.

### Phase 2 — The Brand · "This looks real."
- **[Claude]** Design-system tokens (Premium Elegance: navy #1a2332 / gold #c9a961 / cream
  #f5f1e8; Playfair + Inter); branded login/dashboard/email templates; marketing landing page
  (three-position messaging); onboarding flow (tenure, income, goal, avatar mix, voice-vs-type,
  output prefs); brand-rules linter over all copy.
- **[You/Dev]** Lock the names (recommended: Peakbritt Financial Group + Case Atlas + Atlas); final logo art.
- **Done when:** all UI on-brand; marketing site states recruiting/retention/revenue; copy passes
  the brand-rules checklist.

### Phase 3 — The Brain · "This thinks." *(the core)*
- **[Claude]** Strategy library as typed JSON/DB records (trigger conditions, weights, IRC basis,
  COI needs, upline questions, pitch order); 10-question intake **state machine**; avatar
  classifier (4 avatars, stacked, priority order); recommendation engine over mapping tables;
  **pivot engine** driven by the eligibility-gate table; **9-hard-rules enforcement module**;
  **compliance filter** (runtime, pass/rewrite/hold); Life (12Q) + Annuity (9Q) UW intake;
  underwriting-class estimator; wholesaler-handoff trigger. I can seed the library now from the
  Advanced Case Design Framework + the 9/8 strategy list and swap in your Brain when it lands.
- **[Blocked]** **The Brain** (Jay/Luke's canonical strategy library) — the authoritative content.
  Also the pre-launch validation of the first 3–5 strategies (Jay/Luke sign-off).
- **[You/Dev]** LLM key (OpenRouter) for intake parsing + copy drafting.
- **Done when:** 5–10 real "I've got a guy" scenarios run end-to-end; recommendations only from the
  locked library; pivots fire; hard rules enforced; compliance active on every output.

### Phase 4 — The Output · "This does the work."
- **[Claude]** Commission-math engine (defaults: perm/survivorship/§162 55% Y1, term/DI/LTC 50%,
  annuity 2%, COLI 0.5% face); close-rate + pipeline-value calc; book-of-business ("unmined gold")
  calculator w/ 15% addressable filter; progress dashboard (4 widgets); prospecting list + weekly
  call queue; pipeline aging + 5 coaching triggers; pitch-deck generator (per strategy /
  per-prospect); marketing-piece generator; wholesaler-handoff email engine (variations A–D,
  5 quality checks); video-recommender mapping.
- **[You/Dev]** Real training-video library to map into the recommender; confirm close-rate/
  addressable defaults against Jay's experience.
- **Note:** I'll normalize the minor commission inconsistencies across docs (survivorship 55% vs
  50–60%; $42,900 vs $42,850) to the Progress Dashboard Math doc as the single source of truth.
- **Done when:** an agent runs a full week in-app — call queue → pitch deck → handoff → pipeline
  updates.

### Phase 5 — The Operations · "This is a business."
- **[Claude]** Admin/master dashboard (clients, revenue, activity, churn, support, compliance
  modules); Opportunity Flow + **Learning Loop** (verify/modify → engine learns, event log);
  **Compliance Flag Queue** UI (filter-caught / new-strategy / periodic-audit triggers); annual
  billing (~$2,970); IMO per-seat tiers (50/100/500+); white-label branding engine (logo/color/
  byline per IMO); per-seat usage tracking; IMO-principal reporting; **Pre-Launch Validation**
  workflow (9-step, 12 diagnostic Qs, 3 review paths).
- **[You/Dev]** Compliance officer hired/contracted to work the queue; pilot IMO to test white-label.
- **Done when:** a pilot IMO runs through white-label setup, tiers, dashboard, learning loop, and
  compliance queue end-to-end.

### Phase 6 — The Polish · "Category of one."
- **[Claude]** iPhone-moment polish + on-screen celebrations ("You uncovered $185K…"); behavioral
  nudges; onboarding refinement; email-sequence integration (the 7-email soap opera); in-app
  tooltips + help docs; voice input.
- **[You/Dev]** Launch commercial production (video crew per the script); real testimonials/case
  studies; conference logistics.
- **Done when:** premium feel; email sequence live; ready for IMO conferences + public launch.

---

## D. What I need from you to start building (in priority order)

1. **The Brain** — the canonical strategy library (README + Knowledge Base + Quick Reference
   Index). This is the single dependency that unblocks Phase 3's real content. Until it lands I
   can build every *structure* around it and seed placeholder strategy records.
2. **Tech confirmation** — Next.js + Supabase + OpenRouter + Stripe? (Matches your existing stack.)
3. **Name lock** — or I proceed with `[Insert …]` placeholders and find-and-replace later.
4. **Standalone vs. JARVIS** — fully separate product, or share an auth / strategy-library layer
   with the internal JARVIS portal?

## E. Recommended first move

Say the word and I'll **start Phase 1**: scaffold the repo, lay down the database schema and the
audit-log spine, build auth + admin + Stripe wiring (test mode), and hand you a runnable project
plus the exact Copilot session prompts for the rest of the phase. In parallel I can stand up the
**compliance filter** and the **9-hard-rules module** as standalone tested modules now, since both
are pure logic and don't depend on the Brain — they'll drop straight into Phase 3.
