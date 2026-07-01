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
5. **Session 5:** Build the avatar matching engine (classify prospect into 1+ of 4 avatars)
6. **Session 6:** Build the strategy recommendation engine (draw from Part 5 mapping tables)
7. **Session 7:** Build the pivot-to-alternative logic (age/health/structure/time/ownership checks)
8. **Session 8:** Wire the existing compliance filter module into real recommendation/handoff output
9. **Session 9:** Wire the existing 9-hard-rules module into the real recommendation flow
10. **Session 10:** Build the field underwriting intake (life + annuity, separate flows)
11. **Session 11:** Build the wholesaler handoff template trigger (fires the wholesaler
    notification from Sessions 1-2 in addition to the illustration-request email)
12. **Session 12:** End-to-end testing with 5-10 real scenarios, fix any bugs

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
1. **Session 1:** Build the pitch deck template system (per strategy)
2. **Session 2:** Build the per-prospect deck builder
3. **Session 3:** Build the marketing piece generator
4. **Session 4:** Build the commission math engine (defaults: life 55% Y1, annuity 2%, COLI/face 0.5%)
5. **Session 5:** Build the close rate baseline + pipeline value calculation
6. **Session 6:** Build the progress dashboard (this week, this year, book, closed)
7. **Session 7:** Build the prospecting list + weekly call queue
8. **Session 8:** Build the video recommender (strategy → video mapping)
9. **Session 9:** Build the book-of-business opportunity calculation
10. **Session 10:** End-to-end testing, fix bugs, polish UX

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
1. **Session 1:** Build the admin dashboard (all key metrics)
2. **Session 2:** Add annual billing with the discount target
3. **Session 3:** Build the IMO pricing tier system (50/100/500+)
4. **Session 4:** Build the white-label branding engine
5. **Session 5:** Build the compliance review pipeline
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