# PeakBritt × Case Atlas — Business Plan (v2, $297 era)
## One-year staged plan · Stage-1 goal: $50,000/month

> Supersedes docs/20-business-plan.md's revenue model. Companion docs:
> docs/28-marketing-plan-297.md (marketing plan, SWOT, BGA landscape, psychology framework)
> and docs/29-ad-suite-297.md (ads, scripts, full marketing suite).
>
> **Brand wall (non-negotiable):** PeakBritt Financial Group and Case Atlas are separate,
> self-contained brands. No other affiliation, upline, or partner organization is ever named
> in any public material, ad, script, or sales conversation. All production runs through
> PeakBritt as presented.

---

## 1. The business in one paragraph

PeakBritt Financial Group is a boutique advanced-planning insurance agency (BGA) whose edge
is that its principals actually produce at the level its recruits want to reach. Case Atlas
is the software expression of that edge: the case-design thinking of million-dollar producers,
in an engine any licensed agent can run. The software is sold direct at **$297/month** — and
that price exists primarily as an **anchor**. The real business is contracting: an agent who
moves their business to PeakBritt gets Case Atlas **free** plus **one-on-one mentorship from
million-dollar producers**, and PeakBritt earns an average **20% override** on their production.
At an average target commission of **$10,000 per placed case**, that is **$2,000 of override
revenue per case** — which is where the $50K/month comes from.

## 2. Unit economics (locked)

| Input | Value | Source |
|---|---|---|
| Case Atlas direct price | $297/mo ($2,970/yr annual) | Owner directive 2026-07-06 |
| Case Atlas for contracted producers | $0 (included) | The upsell |
| PeakBritt average override | 20% | Owner |
| Average target commission per case | $10,000 | Owner |
| **Override revenue per placed case** | **$2,000** | 20% × $10K |
| Software gross margin | ~90% (hosting + AI inference + Stripe fees) | SaaS standard |
| Override gross margin | ~95% (wholesaling + case-support time) | Agency |

**Why the free-with-contract offer is rational:** one placed case/month from a contracted
producer ($2,000 override) is worth ~6.7 subscriptions. A producer already writing $100K/year
in personal commission who lifts 30% using the system generates ~$6,000/year in override on the
lift alone — before counting the production they simply move to PeakBritt paper. Giving away
$297/month to acquire a $2K-per-case relationship is a ~10x trade.

### Contracted-producer LTV (conservative)

A $100K/year producer ≈ 10 cases/year at the $10K average. Moving half their business to
PeakBritt = 5 cases = **$10K/year override**. Mentorship lifting them 30% adds ~3 cases =
$6K. **Year-one value per contracted producer ≈ $12–16K**, versus ≈ $3.6K for a subscriber.
Every plan decision below follows from this: **subscriptions fund the machine; contracts are
the business.**

## 3. Two-lane revenue model

| Lane | Offer | Price | Role |
|---|---|---|---|
| **Lane 1 — Software** | Case Atlas subscription | $297/mo | Hook, lead-gen, anchor, cash flow. The ad demos the software; the software demos PeakBritt's brain. |
| **Lane 2 — Contract** | PeakBritt contracting: Case Atlas free + 1-on-1 mentorship from million-dollar producers + advanced-case wholesaling desk | 20% avg override on production | The actual business. Feels exclusive because it IS gated (application + interview + production floor). |

The funnel is Lane 1 → Lane 2 by design: every subscriber is a warm contracting prospect who
is already experiencing the way PeakBritt thinks. The in-app moment where Atlas returns a case
design the agent has never seen before is the moment the mentorship offer becomes believable.

## 4. Stage-1 goal: $50,000/month — the math

Three ways to compose $50K/mo; the plan targets the blend.

| Path | Composition | Feasibility |
|---|---|---|
| Subscriptions only | 169 subs × $297 | Slow; ignores the better lane |
| Overrides only | 25 placed cases × $2,000 | 12–15 active contracted producers placing ~2/mo |
| **Blend (target)** | **70 subs ($20.8K) + 15 cases/mo ($30K) ≈ $50.8K** | **~10–12 contracted producers + steady sub base** |

Working backwards with funnel rates (docs/28 §6): 15 placed cases/mo needs ~10–12 producing
contracted agents; contracting ~2–3 new producers/mo from month 4 gets there by month 10–12.
70 subscribers at a 2% visitor→trial→paid blended rate needs ~3,500 qualified visitors/mo —
achievable on the docs/28 channel plan at the stated budget.

## 5. The one-year staged plan

### Stage 0 — Foundation (Months 0–1)
- Case Atlas production-live on the $297 price (DB + Stripe env vars, seed, webhooks green).
- **Begin Tracy's insurance licensing (see §6)** — start the pre-licensing course in week 1;
  licensing is a Stage-1 deliverable but the clock starts now.
- Legal hygiene: PeakBritt producer agreement (override schedule, free-software clause,
  mentorship terms), E&O verification requirement, carrier appointment paperwork templates.
- Instrument everything: subscription events, demo-watched, contract-application-started, in
  the audit log — Stage 1 is run on these numbers.

### Stage 1 — To $50K/month (Months 1–6)
**Theme: prove the funnel with founder-led sales. Exclusive by construction: 25 contracted
"Founding Producers" max.**

- **Month 1–2:** Launch the docs/29 ad suite (demo-led commercials on Meta/YouTube + LinkedIn
  to agents; the ad IS a Case Atlas screen recording). Sell subscriptions. Run 2 case-design
  webinars/mo where a real "I've got a guy" scenario is run live; end with the Founding
  Producer offer.
- **Tracy licensed** (target: exam passed by month 2, carrier appointments by month 3) →
  Tracy runs case-support and the wholesaler desk inside Case Atlas, and can be named on
  cases. This is the operational capacity that lets contracted-producer count scale past the
  founder's calendar.
- **Month 2–4:** Contract the first 10 producers. Every contracted producer gets: Case Atlas
  free, a 90-day mentorship sprint (weekly 1-on-1, joint case design on their live cases,
  first wholesaler handoffs run together), and a named case-desk contact (Tracy).
- **Month 4–6:** Referral loop ("who's the best producer you know who's stuck?"), publish
  anonymized case wins as proof, scale ad spend on whatever CAC the first 90 days proved.
- **Exit criteria:** $50K/mo total revenue (subs + overrides), ≥10 producing contracted
  agents, Tracy licensed + appointed, CAC and sub→contract conversion measured.

### Stage 2 — Systemize (Months 7–9)
- Productize the mentorship: onboarding curriculum from the live 90-day sprints; group
  case-design calls layered under the 1-on-1s; the "PeakBritt Producer Standard" (production
  floor to keep the contract + free software — keeps the offer exclusive AND enforces the
  override economics).
- Raise the contracted cap from 25 → 50. Waitlist stays public (scarcity is real, not
  theater).
- Second licensed case-desk hire if placed-case volume > 20/mo.
- **Exit criteria:** $50K/mo sustained for 3 consecutive months with ≤20% of new contracts
  sourced by founder outreach (the machine, not the founder, fills the funnel).

### Stage 3 — Scale (Months 10–12)
- Push toward $100K/mo run rate: 120+ subs (~$35K) + 30+ cases/mo (~$60K+).
- Open the annual plan push ($2,970) for cash-flow smoothing.
- Begin Phase-5 groundwork (IMO white-label at $75/seat) WITHOUT launching it — Stage 3 keeps
  the exclusivity story intact; white-label is a 2027 lane.
- Year-end review: unit economics vs. locked assumptions (20% override, $10K average case);
  re-lock or revise for year 2.

## 6. Tracy — licensing plan (Stage-1 deliverable)

| Step | What | Target |
|---|---|---|
| 1 | State pre-licensing course, Life & Health (online self-paced, 20–40 course hours depending on state) | Weeks 1–3 |
| 2 | State exam scheduled at booking time (commit to a date — pass rates are highest within 2 weeks of course completion) | Week 4–6 |
| 3 | Fingerprints/background + state license application | Week of exam |
| 4 | E&O coverage bound | Same week |
| 5 | Carrier appointments through PeakBritt's contracting stack + AML/product training | Weeks 6–10 |
| 6 | Live on the case desk: runs Case Atlas wholesaler-handoff queue, illustration requests, underwriting shepherding | Month 3 |

Budget: course ~$150–300, exam ~$50–150, license ~$50–200, fingerprints ~$50–100, E&O
~$300–600/yr. Total under ~$1,500 — immaterial; the binding constraint is exam scheduling, so
book the exam date the day the course starts.

Role after licensing: Tracy is the **named human inside the software** — subscribers see
"your PeakBritt case desk" respond to handoffs. That is the bridge experience between Lane 1
and Lane 2: subscribers taste the service contracted producers get in full.

## 7. Why agents fail — and why this offer is built the way it is

Industry reality the plan is engineered against (full research + citations framing in
docs/28 §3):

1. **They're recruited, not developed.** The dominant industry model is mass recruiting on
   thin contracts; most agents get product training, not case-design skill. Result: the
   overwhelming majority wash out within their first few years, and survivors plateau.
2. **The $100K plateau is structural, not personal.** An agent hits $100K on activity —
   more calls, more term, more final expense. Past that, growth requires **bigger cases**,
   which requires advanced-planning knowledge (buy-sell, §162, ILIT, qualified-money design)
   nobody around them has. They don't need more hustle; they need a different brain.
3. **They are alone.** No mentor who actually produces at the next level, no one to call with
   "I've got a guy…", no desk that turns a scenario into a design. Isolation is the #1
   emotional driver of stagnation and exit.
4. **"Support" from most BGAs = a contract + a login + a seminar.** Marketing programs and
   lead systems churn agents through the same activity loop that created the plateau.

**Offer design that answers each failure mode:**

| Failure mode | Offer element |
|---|---|
| No case-design skill | Case Atlas: the locked strategy library + 10-question intake returns the full design |
| $100K plateau | Mentorship from producers who actually write $1M+ — joint work on the agent's live cases |
| Isolation | Weekly 1-on-1, named case desk (Tracy), Founding Producer cohort |
| Empty "support" promises | The software is the proof — the ad demos it, the trial delivers it, before any contract talk |
| Skepticism of recruiting pitches | Gated, capped, application-only contracting. We say no. Exclusivity is real. |

## 8. Costs, risks, and the honest version

**Stage-1 monthly cost envelope:** ads $3–6K, tools/hosting/AI <$1K, Tracy licensing one-time
<$1.5K, founder + Tracy time (sweat). Break-even on cash costs at ~25 subscribers — everything
past that funds ad scale.

**Top risks:**
1. **Founder-calendar bottleneck** — 1-on-1 mentorship doesn't scale. Mitigation: Stage-2
   productization, cohort layer, production floor to keep the roster small and productive.
2. **Override concentration** — 15 cases/mo across ~10 producers means one defection hurts.
   Mitigation: mentorship relationship + free software = switching cost; contract terms with
   standard vesting on renewals.
3. **Compliance drift in marketing** — income-lift claims to agents must stay conditioned
   (no guarantees); client-facing outputs already run the in-app compliance filter.
4. **Case-size assumption** — $10K average target commission is the plan's load-bearing
   number. Instrument actual average from case #1; re-forecast monthly.
5. **Ad CAC unknown until live** — hence founder-led sales and webinars carry Months 1–3
   while paid finds its level.

**KPIs on the master dashboard:** MRR, contracted-producer count, placed cases/mo, average
commission/case, override revenue, sub→contract conversion %, CAC by channel, mentorship
session completion, 90-day producer lift (their trailing production vs. pre-contract).
