# Phased Build Plan — Insurance Strategy Engine

## Purpose
This document is the staged build plan for the Insurance Strategy Engine. Each phase has a clear milestone, a definition of done, a batching strategy for GitHub Copilot, and a list of source documents the developer needs to read before starting that phase.

**Use this with a developer who is building the app in a GitHub repo with Copilot (or any AI coding agent).**

---

## Batching Rules for GitHub Copilot

**The sweet spot:** 1 well-bounded user story per Copilot session, with 5–10 related changes inside that session.

**Don't:**
- Bundle multiple unrelated features into one prompt
- Split a single feature into many micro-prompts (Copilot re-reads context every time)
- Send "fix everything in this area" prompts with no constraints

**Do:**
- One prompt = one user story = one session
- State the goal, files in scope, constraints, and definition of done up front
- Let Copilot make the largest safe change within that scope
- Split into a new session when the work branches

**Pattern:** "Build me [single feature]. Files in scope: [list]. Constraints: [list]. Done when: [list]."

---

## Source Documents the Dev Needs (Across All Phases)

- **The brain** — 9 core + 8 supporting strategies, with README, Knowledge Base, and Quick Reference Index
- **Product spec** — 4-layer engine + 4 supporting layers
- **Guardrail system** — compliance engine, brain lock, client profile filter
- **Three-position positioning** — recruiting / retention / revenue
- **Brand rules** — elegant premium feel, no false claims, no "Firm Advantage," no CPA-on-staff language
- **Operational/billing layer** — login, admin control, monthly $97, annual $970-$980, IMO tiered pricing
- **4 avatars** — HNW, Business Owner, Qualified Fund Heavy, Family/Legacy
- **2-product universe** — life insurance (underwritten) + annuity (financially underwritten)
- **9 non-negotiable hard rules** — including the annuity→life direct §1035 prohibition

---

## Phase 1 — The Skeleton
**Milestone:** "We have an app."
**Goal:** Prove the architecture works. The agent can sign up, pay, log in, see an empty dashboard, log out.

### What's in scope
- Web app framework (Next.js or equivalent)
- User login (email/password) with "forgot password" reset
- Stripe billing wired up at $97/mo subscription
- Admin login with grant/revoke/suspend access
- Empty dashboard placeholder with logo + nav
- Database for users, subscriptions, and admin actions
- Basic security (HTTPS, password hashing, session management)
- Environment config (dev/staging/prod)

### What's out of scope (defer to later phases)
- Real strategy content
- Real branding (logo, color, copy)
- Intake flow
- Strategy recommendations
- Pitch deck generation
- White-label support
- IMO pricing tiers

### Definition of done
- [ ] A new user can sign up, pay $97/mo, log in, see an empty dashboard, log out
- [ ] An admin can log in, see all users, suspend or revoke access
- [ ] Stripe webhook correctly handles subscription events (created, canceled, payment failed)
- [ ] All routes are secure (auth required for user pages, admin required for admin pages)
- [ ] App is deployed to a staging environment and accessible via URL

### Batching for Copilot (5-7 sessions)
1. **Session 1:** Scaffold the Next.js app, set up the database schema for users/subscriptions/admin actions, deploy to staging
2. **Session 2:** Build the signup/login flow with email/password, including "forgot password" reset
3. **Session 3:** Build the empty dashboard with placeholder nav and protected routes
4. **Session 4:** Integrate Stripe billing at $97/mo subscription, including the customer portal
5. **Session 5:** Build the admin login, admin dashboard, and grant/revoke/suspend access controls
6. **Session 6:** Stripe webhook handling for subscription lifecycle events
7. **Session 7:** End-to-end testing, fix any bugs, polish the auth UX

---

## Phase 2 — The Brand
**Milestone:** "This looks real."
**Goal:** The empty dashboard looks like something an agent would pay $97/mo to use. The three-position positioning shows up in the messaging.

### What's in scope
- Final name, tagline, and visual identity (agency, software, bot)
- Logo, color palette, typography
- Onboarding flow with the three-position messaging (recruiting/retention/revenue)
- Dashboard layout with branded empty states
- Marketing site (landing page) at the root domain
- Login/signup pages redesigned to match the brand
- Email templates (welcome, password reset, billing) redesigned to match the brand

### What's out of scope
- Real strategy content (Phase 3)
- Real intake flow (Phase 3)
- Real recommendations (Phase 3)

### Definition of done
- [ ] All UI is on-brand (logo, color, type, voice)
- [ ] The marketing site clearly communicates the three-position positioning
- [ ] The onboarding flow names the agent's job-to-be-done in the agent's language
- [ ] The dashboard looks like a real product, not a placeholder
- [ ] All email templates match the brand
- [ ] Brand rules enforced: no "Firm Advantage," no false claims, no specific income claims

### Batching for Copilot (5-7 sessions)
1. **Session 1:** Implement the design system (color tokens, type scale, spacing, component library)
2. **Session 2:** Build the marketing site landing page
3. **Session 3:** Redesign login and signup pages
4. **Session 4:** Redesign the dashboard with branded empty states
5. **Session 5:** Build the onboarding flow with three-position messaging
6. **Session 6:** Redesign all email templates (welcome, password reset, billing alerts)
7. **Session 7:** Brand QA pass — every screen on-brand, every piece of copy compliance-checked

---

## Phase 3 — The Brain
**Milestone:** "This thinks."
**Goal:** The agent can drop a prospect and get a real strategy recommendation back, with pivot-to-alternative logic, compliance language guardrails, and the 9 hard rules enforced.

### What's in scope
- Strategy library ingested (9 core + 8 supporting strategies)
- "I've got a guy" intake flow (10 conversational questions)
- Avatar matching (HNW / Business Owner / Qualified Fund Heavy / Family/Legacy)
- Strategy recommendation engine (using Part 5 mapping tables)
- Pivot-to-alternative logic (when primary doesn't fit)
- Compliance language guardrails (no "tax-free," "while the policy remains in force," etc.) —
  built early as a standalone module in Phase 1 (`src/lib/compliance-filter.ts`); Phase 3 wires it
  into the real recommendation/handoff output instead of raw text.
- 9 hard rules enforced (no annuity→life direct §1035, etc.) — same story, built as a standalone
  module in Phase 1 (`src/lib/hard-rules.ts`); Phase 3 wires it into the real recommendation flow.
- Field underwriting intake (life + annuity, separate flows)
- Wholesaler handoff template trigger (when strategy is viable)
- **Wholesaler assignment + notification** (added post-Phase-2, see
  `docs/23-wholesaler-assignment.md`): admin assigns one wholesaler (a login-capable user) per
  agent; the wholesaler gets a portal view of their assigned agents' cases and an email
  notification at the wholesaler-handoff moment. This layers on top of the wholesaler handoff
  email above — the handoff email still fires per the existing spec; the assigned wholesaler is
  additionally notified in-app and by email that a specific agent is working a case with them and
  should be called.

### What's out of scope
- Pitch deck auto-generation (Phase 4)
- Per-prospect deck builder (Phase 4)
- Progress dashboard (Phase 4)
- Video recommender (Phase 4)
- White-label support (Phase 5)

### Definition of done
- [ ] Agent can drop a prospect, answer 10 intake questions, and get a real strategy recommendation back
- [ ] Avatar classification works (single avatar or stacked)
- [ ] Strategy recommendations are drawn ONLY from the locked strategy library (no AI invention)
- [ ] Pivot-to-alternative logic fires when primary doesn't fit (age, health, structure, time, ownership)
- [ ] Compliance language guardrails active on every output
- [ ] The 9 hard rules enforced at the engine level (not just documented)
- [ ] Field underwriting intake works for both life and annuity
- [ ] Wholesaler handoff email auto-generates when strategy is viable
- [ ] An agent's assigned wholesaler can log in, see that agent's cases, and is notified
      (in-app + email) at the wholesaler-handoff moment
- [ ] Tested with 5-10 real "I've got a guy" scenarios end-to-end

### Batching for Copilot (11-13 sessions)
1. **Session 1:** Wholesaler assignment schema + admin management UI + core lib (Brain-independent
   — built first since it doesn't need the strategy library; see docs/23-wholesaler-assignment.md)
2. **Session 2:** Wholesaler portal (role-based routing, case list view, notification wiring)
3. **Session 3:** Ingest the strategy library into the database (9 core + 8 supporting, with all fields)
   — **done with a caveat:** the canonical brain doc referenced throughout these docs was never
   delivered into this repo (see docs/21-final-handoff.md section 7 — "provided in the source
   conversation"). Schema + seed shipped with the 10 strategies that *are* fully documented in
   docs/advanced-case-design-framework.md (2 core: Survivorship, Premium Financing; all 8
   supporting) as `status: documented`, and the other 7 core strategies named across the docs but
   never given mechanics/legal-basis (Estate Funding, GRATs, QWT, RMD Repositioning, Roth+Life,
   Annuity Rescue, Qualified LTC) as `status: pending_content` placeholders. **Action item for
   Jay:** supply the real brain doc content for these 7 before Session 6 (recommendation engine) —
   the engine is coded to only ever surface `documented` strategies, so it will simply have a
   thinner core library until then, never a fabricated one.
4. **Session 4:** Build the "I've got a guy" intake flow (10 questions, conversational voice)
   — **done with a caveat:** shipped as a structured step-by-step form (real fields, Atlas's exact
   question wording, all 10 answers persisted on the Scenario record) rather than the doc's
   "type a paragraph, Atlas parses it" free-text NLP experience — that needs an AI backend behind
   CLAUDE.md's `callModel(complexity, messages)` abstraction, which hasn't been chosen/wired up yet
   (no provider, no API key). **Action item for Jay:** confirm the AI backend (OpenAI / Anthropic /
   open-source, per docs/21-final-handoff.md's first-week checklist) so a later session can add
   free-text parsing on top of this same schema — the structured intake underneath doesn't change.
5. **Session 5:** Build the avatar matching engine (classify prospect into 1+ of 4 avatars) — done.
   Section 3's classification table needs net worth and qualified-fund data the fixed 10 questions
   don't collect; added 3 optional follow-up fields (net worth estimate, qualified-funds estimate,
   dependents under 18) per the doc's own worked example ("worth asking if they have IRAs..."). The
   engine returns `needsMoreInfo` for HNW/Qualified-Fund-Heavy when those follow-ups are unanswered
   rather than guessing. The AMT-trap flag is band-level (from Q10's income/revenue bucket), not a
   precise trigger — noted on the output.
6. **Session 6:** Build the strategy recommendation engine (draw from Part 5 mapping tables) —
   done, scoped to the 10 documented strategies only (Brain Lock: pending_content strategies are
   never evaluated or surfaced). No Part 5 mapping tables exist in this repo (same brain-doc gap as
   Session 3), so each documented strategy's gate is hand-coded from its own
   `matchingParameters` against real scenario fields — extended intake with
   docs/advanced-case-design-framework.md section 2's HNW parser schema (marital status, estate
   value vs. exemption, control/funding preference, existing structures, etc.) as an optional
   section, since the 8 supporting strategies' gates need it. Each strategy resolves to
   eligible / needs-more-info / not-eligible; only eligible + needs-more-info are shown to the
   agent. Hard-rules wiring is still Session 9's job, not done here — none of the 10 documented
   strategies currently touch annuity/COLI/MEC territory, so this is a deliberate sequencing
   choice, not an oversight.
7. **Session 7:** Build the pivot-to-alternative logic (age/health/structure/time/ownership checks)
   — done. docs/04-field-underwriting.md section 5 turned out to have the real, doc-sourced gate
   thresholds (age > 80 for most life strategies) this needed — no invented numbers. Structure/
   ownership/time gates (no co-owners, no key employees, estate below exemption) were already
   enforced per-strategy in Session 6's gates. Health is a softer flag (not a hard exclusion) since
   a real Table-rating estimate needs the full 12-question life underwriting intake (Session 10),
   not built yet. When the age gate fires, Atlas pivots per docs/03-intake-flow.md section 5's
   format — but honestly states that the annuity-side alternatives (QWT, Annuity Rescue, Qualified
   LTC) are still pending_content rather than recommending one that isn't in the locked library.
   Verified against the doc's own age/health worked example.
8. **Session 8:** Wire the existing compliance filter module into real recommendation/handoff output
   — **deferred, not skipped:** there's no client-facing artifact in this codebase yet to wire it
   into. CLAUDE.md scopes the compliance filter to "every client-facing output" / "client copy" —
   everything built through Session 9 (the intake, the recommendation card, the wholesaler portal)
   is internal agent/wholesaler tooling, where the worked examples in the docs themselves show
   Atlas freely naming strategies ("ILIT," "COLI," "REBA") to the agent. Forcing the filter onto
   that internal view now would strip exactly the structure names the agent needs to see, and
   would be reworked the moment Phase 4 builds the actual client-facing pitch deck / marketing
   piece. Revisit this the moment Phase 4, Session 1 (pitch deck templates) exists.
9. **Session 9:** Wire the existing 9-hard-rules module into the real recommendation flow — done,
   scoped honestly. Of the 9 rules, only rule 4 (ILIT must be original owner to avoid the §2035
   3-year lookback) has anything to check against right now — rules 1/2/3/6/8/9 guard annuity
   exchanges/MEC/qualified-plan-life scenarios that don't exist in this library (the annuity-side
   strategies are all pending_content), rule 5 guards COLI (not one of the 17 seeded strategies at
   all), and rule 7 (reasonable compensation for §162 bonus) is a compliance judgment call, not
   something inferable from current scenario fields. Added `existingPolicyTransfer` to the intake;
   when true, the ILIT recommendation now surfaces the rule 4 violation and its suggested fix
   inline rather than silently passing.
10. **Session 10:** Build the field underwriting intake (life + annuity, separate flows) — done.
    Age and tobacco (Q1/Q3) reuse the 10-question intake's identical fields rather than asking
    twice. Medications (Q4) aren't parsed from free text into conditions — that mapping needs the
    AI backend, not wired up — so majorDiagnoses captures the condition-level signal directly.
    Built a real `estimateUnderwritingClass()` against section 3's table (age/build/tobacco/
    diagnoses/family-history/occupation/hobby/DUI, worst-factor-wins), which now feeds Session 7's
    health-concern note directly instead of the coarse healthRating-only proxy. The annuity intake
    is standalone infrastructure — no documented strategy is annuity-funded yet, so nothing
    triggers from it automatically, but it's ready the moment Session 3's content gap closes.
11. **Session 11:** Build the wholesaler handoff template trigger (fires the wholesaler
    notification from Sessions 1-2 in addition to the illustration-request email) — done. The
    manual "Notify my wholesaler" bridge from Session 3 is now gated on the real eligibility gates
    (Sessions 6/7/9): it refuses with a clear reason if a pivot is pending or no strategy is fully
    eligible yet, matching docs/06-wholesaler-handoff.md section 1 ("the handoff only happens on a
    viable strategy"). `src/lib/handoff.ts` builds the real illustration-request content (client
    profile, business context, scenario summary, strategy requested, COI note) from the
    recommendation engine and underwriting data, shown to the agent as a preview before they send —
    Atlas still never auto-sends. Deliberately out of scope: commission math (explicitly Phase 4
    per CLAUDE.md's own layer breakdown) and the full A/B/C/D variation handling (Variations C/D
    need annuity/QWT strategies that are still pending_content — only A/B are reachable today).
    Verified end-to-end: the handoff is blocked pre-gate, then fires with real content once ILIT
    becomes eligible, and the wholesaler receives the rich email.
12. **Session 12:** End-to-end testing with 5-10 real scenarios, fix any bugs — done. Ran 6
    scenarios spanning every mechanism built in Phase 3: Business Owner + REBA, an HNW estate
    stack (Survivorship + ILIT + SLAT + Dynasty all firing together), a pure Family/Legacy case
    (correctly returns the honest "none of the standard strategies are a clean fit" message — no
    documented strategy is tagged for that avatar yet), an elderly/impaired pivot case, an ILIT
    hard-rule-4 violation, and a Qualified-Fund-Heavy case hitting the AMT-trap diagnostic. Zero
    console/page errors across the batch; every gate check, pivot, and recommendation logged to
    audit_log as required. No bugs found — no fixes needed this session.

    **Phase 3 close-out:** all 12 sessions complete. Two real content gaps carried forward rather
    than papered over — (1) 7 of the 17 locked strategies are `pending_content` pending the real
    brain doc from Jay/Luke (Session 3/6/7 note), and (2) the AI backend for free-text NLP intake
    parsing hasn't been chosen yet (Session 4 note). Everything built works honestly within those
    limits: the engine never fabricates a strategy or a class estimate, and clearly labels what it
    doesn't know yet.

---

## Phase 4 — The Output
**Milestone:** "This does the work."
**Goal:** The agent can run their entire week inside the app. They open the app Monday, get a list of who to call with what pitch, make the calls, log the activity, and see their pipeline update.

### What's in scope
- Pitch deck auto-generator (per strategy)
- Per-prospect deck builder (customized to the prospect)
- Marketing piece generator (per strategy)
- Progress dashboard (commission math, close rate, pipeline value)
- Prospecting list with weekly call queue
- Video recommender (relevant training video surfaces when a strategy is recommended)
- Book-of-business opportunity number ("unmined gold" calculation)
- Onboarding flow (extended for avatar + book-of-business data collection)

### What's out of scope
- White-label support (Phase 5)
- IMO pricing tiers (Phase 5)
- Admin dashboard (Phase 5)

### Definition of done
- [ ] Agent can build a customized pitch deck for any prospect
- [ ] Agent can build a marketing piece for any strategy
- [ ] Progress dashboard shows: this week's pipeline, this year's pipeline, book-of-business opportunity, closed this year
- [ ] Prospecting list shows the agent's prospects ranked by opportunity value
- [ ] Weekly call queue auto-generates each Monday
- [ ] Video recommender surfaces the right training video for each strategy recommendation
- [ ] Tested with a real agent on a real prospect end-to-end

### Batching for Copilot (8-10 sessions)
1. **Session 1:** Build the pitch deck template system (per strategy) — **blocked, not started:**
   docs/12-pitch-decks.md turned out to be the *sales* deck for pitching Case Atlas itself to
   agents/IMOs, not a spec for the per-strategy client-facing deck this session needs. No doc in
   this repo gives slide-by-slide content for that feature (same shape of gap as the missing brain
   doc). Built Session 4 first instead, since it has a real, complete spec.
2. **Session 2:** Build the per-prospect deck builder — blocked on Session 1.
3. **Session 3:** Build the marketing piece generator — same content gap as Session 1.
4. **Session 4:** Build the commission math engine (defaults: life 55% Y1, annuity 2%, COLI/face 0.5%)
   — done. Added `ScenarioStrategyEstimate` (product type + annual premium/face amount per
   recommended strategy — neither Scenario nor Strategy tracked case-size numbers before this) and
   `src/lib/commission.ts`'s rate table + agent-level override. Verified end-to-end: a $50,000
   permanent-life premium against an eligible ILIT correctly computes $27,500 (55%), persists, and
   rehydrates on reload.
5. **Session 5:** Build the close rate baseline + pipeline value calculation — done. Q9's
   existing/new_prospect answer is too coarse for the doc's 6-category close-rate table, so added
   an optional `relationshipType` field (kept separate from Q9, which is one of the fixed 10
   questions) plus an agent-level flat-rate override, mirroring Session 4's commission override
   pattern. `computeExpectedCommissionValue()` = expected commission × close rate. Verified: a
   $27,500 expected commission at the "existing prospect, second meeting" (40%) rate correctly
   computes an $11,000 expected commission value.
6. **Session 6:** Build the progress dashboard (this week, this year, book, closed) — done. Added a
   real `ScenarioStatus` enum (draft/active/in_underwriting/closed_won/closed_lost, replacing the
   unused free-text `status` string) plus `closedAt`, and a status-change control on the scenarios
   list. `/app` now renders the four widgets from section 5: This Week's Pipeline (not-closed
   scenarios updated in the last 7 days), This Year's Pipeline (every scenario created YTD, with
   the status breakdown), Book-of-Business Opportunity (Session 9's calculator), and Closed This
   Year (actual commission — not close-rate-adjusted — for `closed_won` scenarios closed this
   year), plus the doc's "list of every active scenario" below the four numbers. No separate
   activity log or meeting-scheduler exists, so "activity in the last 7 days" uses `updatedAt` as a
   simplification. Section 6's pipeline aging (stale/at-risk/cold flags), section 7's coaching
   triggers, and goal tracking are out of scope for this session — they need the activity log and
   agent-set goals this repo doesn't have yet. Verified end-to-end: a closed_won scenario with a
   $50k permanent-life estimate and an "existing, strong relationship" type correctly shows $27,500
   under Closed This Year and $11,000 (the close-rate-adjusted value) under This Year's Pipeline.
7. **Session 7:** Build the prospecting list + weekly call queue — done. No dedicated spec doc
   exists for this feature (same gap shape as the pitch deck); the only concrete content is
   docs/00-developer-brief.md's "this week, call these 3 prospects with these pitches" and
   docs/03-intake-flow.md's own worked example, where a "prospect" is just a logged scenario and
   its expected commission value. Built `/app/prospects`: a full prospecting list of every open
   (non-closed) scenario ranked by expected commission value (reusing Session 5/6's calculators),
   plus a top-3 weekly call queue where each entry's "pitch" is its top eligible recommendation from
   the Phase 3 recommendation engine. There's no cron/job runner in this repo, so "auto-generates
   each Monday" is implemented as lazy generation: the queue is computed and persisted
   (`WeeklyCallQueueEntry`, keyed by user + Monday-anchored week) the first time the agent opens the
   page that week, then stays pinned for the rest of the week rather than re-ranking on every view.
   Verified end-to-end: 4 scenarios with premiums yielding $44,000/$27,500/$11,000/$2,750 expected
   commission correctly rank in that order on the full list, the top 3 are queued with the ILIT
   pitch, the 4th is excluded, and adding a 5th, higher-value scenario mid-week does not reshuffle
   the already-generated queue.
8. **Session 8:** Build the video recommender (strategy → video mapping) — **blocked, not
   started:** the only mention of this feature anywhere in the docs is the one-line description in
   docs/00-developer-brief.md ("relevant training video surfaces when a strategy is recommended")
   and a placeholder field name in docs/09-prelaunch-validation.md. No training video library, no
   video URLs, no strategy-to-video mapping exists in this repo or its docs — same shape of gap as
   the pitch deck (Sessions 1-3). Building this would mean inventing video content/links, which
   CLAUDE.md's Brain Lock principle (no fabrication) rules out. Skipped in favor of Session 10.
9. **Session 9:** Build the book-of-business opportunity calculation — done, built ahead of
   Session 6 (dashboard) since the dashboard needs this number. Added the 5 per-avatar client
   counts to AgentProfile and a Settings-page form (kept editable outside the one-time onboarding
   wizard, since the doc expects quarterly updates) using CLAUDE.md's locked per-avatar rates ($35k
   BO w/ co-owners, $12k BO solo, $8k HNW, $6k Qualified-Fund, $2.5k Family/Legacy) and 15%
   addressable filter. Average client age/net worth/revenue and existing-coverage fields from the
   doc's "data the agent provides" list aren't modeled — the doc's own calculation and worked
   example never use them, only the per-avatar counts do. Verified against the doc's exact worked
   example (40/15/25/30/50 clients): $2,085,000 total, $312,750 addressable at 15%.
10. **Session 10:** End-to-end testing, fix bugs, polish UX — done. Ran a real agent through a
    full week against a production build: set up book-of-business (the doc's own worked example),
    logged two cases (one closed-won this week, one still open, different relationship types and
    premiums), then checked the dashboard, prospecting list, and call queue together. All four
    dashboard numbers reconciled exactly ($2,475 this week's pipeline, $15,675 this year's = $13,200
    closed-won expected value + $2,475 open, $312,750 addressable book, $33,000 closed this year —
    the raw commission, not close-rate-adjusted, matching the doc's "actual commissions earned"
    definition), the closed-won case correctly dropped out of the open prospecting list, and the
    remaining open case appeared in both the full list and the call queue with the correct value
    and an ILIT pitch. Swept every Phase 4 page (`/app`, `/app/scenarios`, `/app/prospects`,
    `/app/pipeline`, `/app/settings`) for console/page errors — zero found. No bugs found this
    session — all 54 Vitest tests, ESLint, and `tsc --noEmit` pass clean.

    **Phase 4 close-out:** 5 of 10 sessions done (4, 5, 6, 7, 9) plus this one; 4 sessions (1-3
    pitch deck, 8 video recommender) remain explicitly blocked on real content gaps that don't
    exist anywhere in this repo's docs — no slide-by-slide pitch deck spec and no training video
    library, matching the same "don't fabricate" principle as Phase 3's brain-doc gap. Everything
    built works honestly within that limit.

---

## Phase 5 — The Operations
**Milestone:** "This is a business."
**Goal:** The product is ready to sell to IMOs/FMOs/BGAs and to scale.

### What's in scope
- Admin dashboard (logins, activity, churn, prospects added, strategies recommended, pitches built)
- Annual billing with discount (~$970-$980/yr)
- IMO/FMO/BGA/GA white-label pricing tiers (50 / 100 / 500+ seats)
- White-label branding engine (logo, color, byline per IMO)
- Compliance review pipeline (every output tagged for compliance sign-off)
- Per-seat usage tracking (which agents are active, which are churning)
- IMO-level reporting (which agents are getting value, which are at risk)

### What's out of scope
- Onboarding flow polish (Phase 6)
- Email sequence integration (Phase 6)
- Launch commercial (Phase 6)

### Definition of done
- [ ] Admin dashboard shows all the metrics the IMO principal cares about
- [ ] Annual billing works at the discount target ($970-$980/yr)
- [ ] IMO white-label pricing tiers work (50/100/500+ seats)
- [ ] White-label branding engine lets an IMO upload their logo, pick their color, and ship a branded version of the app
- [ ] Compliance review pipeline flags every output for sign-off
- [ ] Tested end-to-end with a pilot IMO before going public

### Batching for Copilot (6-8 sessions)
1. **Session 1:** Build the admin dashboard (all key metrics) — done, scoped to what's
   computable from real data today. Built `/admin/dashboard` (docs/08-master-dashboard.md):
   Module 1's Agents tab (MRR contribution, engagement score, added `User.lastLoginAt`, stamped on
   both signup and login), Module 2 Revenue (Total/New/Churned MRR — single segment until Session
   2 adds annual and Session 3 adds IMO seats; churn rate approximates "starting MRR" since no
   historical MRR snapshot is stored), Module 3 Activity (engagement scores, top-20 active agents,
   activity trends — pitch-deck and COI-action counters omitted since neither feature exists yet),
   and Module 4 Churn (at-risk agents via the two triggers this data supports; the third trigger,
   "declining vs. 90-day average," needs a historical baseline not tracked). Module 1's IMOs tab is
   blocked on Session 3's IMO model. Module 5 (Support/ticketing) and Module 6 (Compliance Flag
   Queue, Session 5) are out of scope for this session — Support has no ticketing infrastructure
   anywhere in this repo, a gap of the same shape as the pitch deck/video recommender. Caught and
   fixed a real bug during verification: signup establishes a session directly without calling
   `logIn()`, so every fresh signup read as "never logged in" and permanently appeared on the
   at-risk churn list — fixed by stamping `lastLoginAt` at signup too. Verified end-to-end: a real
   $97/mo subscription, a canceled one, and an admin-comped one correctly show $97 total MRR (comped
   excluded), $97 churned MRR, ~50% churn rate, and the comped/canceled agents don't appear as
   active MRR contributors.
2. **Session 2:** Add annual billing with the discount target — done. Added a
   `agent_annual_970` plan ($970/yr, the low end of CLAUDE.md/docs/20-business-plan.md's locked
   "~$970-980/yr, ~16-20% discount" range) alongside the existing $97/mo plan. Both `createCheckoutSession`
   and the two places that write a subscription row after checkout (the success-redirect sync in
   `src/lib/billing.ts` and the `checkout.session.completed` webhook handler) now read which plan
   was purchased off the Checkout session's `metadata.planKey` — Stripe's session payload doesn't
   otherwise carry the price/plan without an extra expand+API call. The billing page offers both
   plans side by side. Updated the Session 1 master dashboard's MRR math to add the annual segment
   (`$970 ÷ 12` per docs/08-master-dashboard.md's own formula) to Total/New/Churned MRR and the
   "MRR by segment" breakdown. **Not verified via a live Stripe Checkout redirect** — no
   `STRIPE_PRICE_ID_AGENT_ANNUAL` Stripe Price object exists in this sandbox (creating one would
   mean writing to the user's real Stripe account without being asked), so the webhook-side plan
   mapping is covered by a new vitest case in `tests/stripe-webhooks.test.ts` instead (same rigor
   as the existing $97/mo webhook tests), and the billing-page UI + master-dashboard MRR math were
   verified by writing a subscription row directly (bypassing Stripe), confirming $970/yr displays
   correctly and contributes $81/mo (rounded) to Total MRR. A real Price ID needs to be created and
   set in `.env` before this can process a live annual purchase.
3. **Session 3:** Build the IMO pricing tier system (50/100/500+) — done. Added the `Imo` model
   (docs/08-master-dashboard.md section 7's `imos` table: name, org type imo/fmo/bga/ga, primary
   contact, seats purchased, contract terms) and `User.imoId` — a seated agent gets dashboard
   access via the IMO's contract instead of their own Stripe Subscription (`hasImoSeatAccess` in
   `src/lib/imo.ts`, wired into `src/app/app/layout.tsx`'s access gate). $75/seat/month is flat
   regardless of tier — docs/20-business-plan.md's 50/100/500+ figures are typical contract sizes
   (small/mid/large IMO), not a discount schedule, and no doc gives a per-tier rate. IMO contracts
   are sold and invoiced manually (section 5's "your contract" language) — no self-serve Stripe
   flow exists for IMOs; adding/removing seats just logs an audit event as the "billing event" the
   doc describes, for the sales/ops team to invoice against. Built `/admin/imos` (create IMOs,
   update seat counts, assign/remove agent seats) and completed Module 1's IMOs tab and the master
   dashboard's IMO revenue segment, both explicitly deferred in Session 1's note. Verified
   end-to-end: a fresh agent with no subscription is redirected to `/billing`; once seated on a
   5-seat IMO contract they reach `/app` directly; the IMO page shows "1 active / 5 purchased seats
   (4 unfilled) — $75/mo"; the master dashboard's Total MRR correctly sums $194 (2 monthly) + $81
   (1 annual) + $75 (1 IMO seat) = $350; and removing the seat immediately revokes dashboard access.
4. **Session 4:** Build the white-label branding engine — done, scoped to the 3 things
   docs/00-developer-brief.md actually names: "logo, color, byline per IMO." Added `logoUrl`,
   `accentColor`, `byline` to `Imo` and a branding form on `/admin/imos`. `logoUrl` is a hosted
   image URL the IMO supplies, not an uploaded file — no object storage (S3/Supabase Storage/etc.)
   is configured anywhere in this repo, a gap of the same shape as the missing AI backend, so a
   real upload pipeline isn't built. Applied to `src/components/ui/Wordmark.tsx` and wired into the
   agent-facing nav (`src/app/app/layout.tsx`) for seated agents — branding pre-authentication pages
   (login/signup) or a custom domain per IMO would need real multi-tenant routing infrastructure
   that's out of scope for one session. Verified end-to-end: a seated agent on a branded IMO sees
   the IMO's logo and byline in place of "Case Atlas / by Peakbritt Financial Group," while a
   non-seated user still sees the default branding. (Caught and fixed a test-harness bug during
   verification, not an app bug: the test script read a stale IMO id off the page immediately after
   a create-then-redirect, a Next.js router-cache staleness issue — fixed with an explicit fresh
   page load before the next form interaction, matching the same class of fix used earlier this
   session for same-page server-action forms.)
5. **Session 5:** Build the compliance review pipeline — done, scoped to
   docs/08-master-dashboard.md section 4's Compliance Flag Queue (the model/queue/resolution
   workflow), not docs/09-prelaunch-validation.md's much larger 9-step conversational validation
   process (12-question AI interview, document upload/indexing, 3-path review) — that's its own
   epic needing the same missing AI backend and missing object storage flagged in earlier
   sessions. Built `/admin/compliance`: a `ComplianceFlag` model (trigger type, status, content,
   optional scenario/strategy link) and clear/reject/escalate resolution actions. Of the doc's 3
   triggers, 2 are real and wired to actual data: **pre-launch** flags a `pending_content` strategy
   from `/admin/strategies` for review (clearing it records the sign-off but doesn't flip the
   strategy to `documented` — that still needs real content, a separate step, per Brain Lock);
   **periodic audit** samples 5% of scenarios with a real sent wholesaler handoff and snapshots the
   actual handoff content into the flag. **Filter-caught** flags have no live pipeline to fire from
   — confirmed again that no client-facing output exists anywhere in this app (Phase 3 Session 8's
   finding still holds), so nothing creates one automatically, though the model/queue fully support
   it once one exists. No cron runner exists, so the periodic audit is admin-triggered rather than
   scheduled (same limitation as the weekly call queue). Verified end-to-end: sending a real
   wholesaler handoff, running the audit, and resolving the resulting flag all persisted correctly
   in the database (confirmed directly, since two of the checks hit the same `textContent()`
   whitespace quirk documented earlier this session).
6. **Session 6:** Build per-seat usage tracking
7. **Session 7:** Build IMO-level reporting
8. **Session 8:** End-to-end testing with a pilot IMO

---

## Phase 6 — The Polish
**Milestone:** "This is a category of one."
**Goal:** The version you show at IMO conferences and use in the launch.

### What's in scope
- iPhone-moment polish (the killer visual)
- On-screen celebrations ("You just uncovered $185K in opportunities")
- Behavioral triggers ("You haven't logged activity in 4 days")
- Onboarding flow refinement
- Email sequence integration (5-7 email soap-opera for stuck producers)
- Launch commercial production
- Help docs + onboarding videos
- In-app tooltips and guidance

### Definition of done
- [ ] The app feels premium and finished
- [ ] Every moment of friction is polished
- [ ] The launch commercial is produced
- [ ] The email sequence is integrated
- [ ] The help docs are complete
- [ ] Ready to show at IMO conferences and go public

### Batching for Copilot (5-7 sessions)
1. **Session 1:** iPhone-moment polish + on-screen celebrations
2. **Session 2:** Behavioral triggers + nudges
3. **Session 3:** Onboarding flow refinement
4. **Session 4:** Email sequence integration
5. **Session 5:** Help docs + in-app tooltips
6. **Session 6:** Launch commercial production coordination
7. **Session 7:** Final QA pass

---

## What the Dev Needs From You at the Start of Each Phase

| Phase | Source-of-truth docs to provide |
|---|---|
| Phase 1 | Operational/billing layer doc; brand rules doc (placeholders OK at this stage) |
| Phase 2 | Brand package (name, tagline, logo, color, type, copy); three-position positioning |
| Phase 3 | The brain (9 core + 8 supporting); intake flow doc; field underwriting questionnaire; compliance language standards; 9 hard rules |
| Phase 4 | Pitch deck templates; commission math assumptions; close rate baseline; video library |
| Phase 5 | White-label spec; IMO pricing tiers; compliance review pipeline spec |
| Phase 6 | Marketing package; email sequence; help docs |

---

## Testing Protocol (Non-Negotiable)

**At the end of every phase, the dev tests end-to-end before moving to the next phase.** No exceptions.

**End-of-phase test for each phase:**
- Phase 1: Sign up, pay, log in, see empty dashboard, log out. Test admin actions.
- Phase 2: Walk through every screen. Check every piece of copy against the brand rules. Show the marketing site to 3 people outside the build and ask "what does this product do?"
- Phase 3: Run 5-10 real "I've got a guy" scenarios end-to-end. Verify the recommendations, the pivots, the compliance language, the hard rules.
- Phase 4: Run a real agent through a real week. Verify the prospecting list, the call queue, the progress dashboard, the pitch deck.
- Phase 5: Run a pilot IMO through the white-label setup, the pricing tiers, the admin dashboard, the compliance pipeline.
- Phase 6: Show the app to 5 agents outside the build. Show the IMO pitch to 3 IMO principals. Get feedback. Iterate.

---

*Last updated: June 30, 2026. This document will be updated as each phase is completed.*