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
in an engine any licensed agent can run. Revenue comes through **three sales channels**:
(1) the software, sold direct at **$297/month** — a price that also works as an **anchor**;
(2) the **override** on recruited agents' production — an agent who contracts with PeakBritt
gets Case Atlas at **no cost** plus **one-on-one mentorship from million-dollar producers**,
and PeakBritt earns an average **20% override** (at a **$10,000** average target commission,
**$2,000 per placed case**); and (3) **Luke and Jay's personal production** at a **90%
commission contract** on an average sale of **$50,000** — roughly **$45,000 of revenue per
personal case**. Channel 3 funds and de-risks Stage 1 while channels 1–2 are built into a
machine.

## 2. Unit economics (locked)

| Input | Value | Source |
|---|---|---|
| Case Atlas direct price | $297/mo ($2,970/yr annual) | Owner directive 2026-07-06 |
| Case Atlas for contracted producers | $0 (included) | The upsell |
| PeakBritt average override | 20% | Owner |
| Average target commission per recruited-agent case | $10,000 | Owner |
| **Override revenue per placed case** | **$2,000** | 20% × $10K |
| Luke & Jay personal commission contract | 90% | Owner |
| Average personal sale (target commission) | $50,000 | Owner |
| **Revenue per personal case** | **~$45,000** | 90% × $50K |
| Software gross margin | ~90% (hosting + AI inference + Stripe fees) | SaaS standard |
| Override gross margin | ~95% (wholesaling + case-support time) | Agency |

**Why the no-cost-with-contract offer is rational:** one placed case/month from a contracted
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

## 3. The three sales channels

| Channel | Offer | Economics | Role |
|---|---|---|---|
| **1 — Software** | Case Atlas subscription | $297/mo | Hook, lead-gen, anchor, cash flow. The ad demos the software; the software demos PeakBritt's brain. |
| **2 — Override** | PeakBritt contracting: Case Atlas at no cost + 1-on-1 mentorship from million-dollar producers + advanced-case wholesaling desk | 20% avg override ≈ $2K/placed case | The scalable business. Feels exclusive because it IS gated (application + interview + production floor). |
| **3 — Personal production** | Luke & Jay's own advanced-planning cases, sourced largely through the CPA/COI network (see §7) | 90% contract × $50K avg sale ≈ $45K/case | Stage-1 revenue engine, proof-of-concept for everything the ads claim, and the live material the mentorship teaches from. |

The funnel is Channel 1 → Channel 2 by design: every subscriber is a warm contracting prospect
who is already experiencing the way PeakBritt thinks. The in-app moment where Atlas returns a
case design the agent has never seen before is the moment the mentorship offer becomes
believable. Channel 3 runs in parallel and feeds the other two: every personal case Luke and
Jay close is (a) revenue now, (b) an anonymized case study for the ads and the Library, and
(c) the credibility that makes "mentored by million-dollar producers" a fact, not a slogan.

## 4. Stage-1 goal: $50,000/month — the math

Ways to compose $50K/mo; the plan targets the blend.

| Path | Composition | Feasibility |
|---|---|---|
| Subscriptions only | 169 subs × $297 | Slow; ignores the better channels |
| Overrides only | 25 placed cases × $2,000 | 12–15 active contracted producers placing ~2/mo |
| Personal production only | ~1.1 personal cases/mo × $45,000 | Achievable but single-threaded on Luke & Jay's calendar |
| **Blend (target)** | **1 personal case/mo ($45K on avg) + 20 subs ($5.9K) ≈ $50.9K, transitioning to 70 subs + 15 override cases + personal production as recruiting ramps** | **Personal production carries months 1–6; channels 1–2 take over the base by months 10–12** |

The honest structure of Stage 1: **one personal $50K case a month effectively hits the goal on
its own** — that is what a 90% contract on advanced-planning cases does. But personal
production is lumpy and calendar-bound, so the plan treats it as the bridge, not the business:
subscriptions and overrides are built underneath it so that by Stage 3 the $50K floor stands
without a single personal case. Working backwards with funnel rates (docs/28 §6): 15 placed
override cases/mo needs ~10–12 producing contracted agents; contracting ~2–3 new producers/mo
from month 4 gets there by month 10–12.

## 5. The one-year staged plan

### Stage 0 — Foundation (Months 0–1)
- Case Atlas production-live on the $297 price (DB + Stripe env vars, seed, webhooks green).
- **Begin Tracy's insurance licensing (see §6)** — start the pre-licensing course in week 1;
  licensing is a Stage-1 deliverable but the clock starts now.
- Legal hygiene: PeakBritt producer agreement (override schedule, no-cost-software clause,
  mentorship terms), E&O verification requirement, carrier appointment paperwork templates.
- **Close the $300K investment (docs/30-investor-pack-300k.md):** the investor serves as
  **the front man during the transition** (see §8), and **our upline partner Magellan
  Financial provides video production and marketing resources in-kind** — so the raised
  capital buys distribution (media spend), not production overhead. Luke and Jay's calendars
  stay on production and mentorship.
- **Book the first CPE seminar dates** (see §7): the CPA-network channel has the longest lead
  time of anything in the plan, so the calendar work starts now.
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
  Tracy **holds the contracts**: the carrier appointments and recruited-agent contracting
  paperwork run through her license. Case design, mentorship, and the wholesaler desk stay
  with Luke and Jay for now.
- **Luke & Jay personal production (Channel 3):** work the CPA/COI pipeline (§7) toward the
  first personal $50K cases — the revenue bridge while recruiting ramps.
- **Month 2–4:** Contract the first 10 producers. Every contracted producer gets: Case Atlas
  at no cost, a 90-day mentorship sprint (weekly 1-on-1 with Luke or Jay, joint case design on
  their live cases, first wholesaler handoffs run together).
- **Month 4–6:** Referral loop ("who's the best producer you know who's stuck?"), publish
  anonymized case wins as proof, scale ad spend on whatever CAC the first 90 days proved.
- **Exit criteria:** $50K/mo total revenue (subs + overrides), ≥10 producing contracted
  agents, Tracy licensed + appointed, CAC and sub→contract conversion measured.

### Stage 2 — Systemize (Months 7–9)
- Productize the mentorship: onboarding curriculum from the live 90-day sprints; group
  case-design calls layered under the 1-on-1s; the "PeakBritt Producer Standard" (production
  floor to keep the contract + no-cost software — keeps the offer exclusive AND enforces the
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
| 6 | Live as PeakBritt's contract holder: recruited-agent contracting and carrier appointments run through her license | Month 3 |

Budget: course ~$150–300, exam ~$50–150, license ~$50–200, fingerprints ~$50–100, E&O
~$300–600/yr. Total under ~$1,500 — immaterial; the binding constraint is exam scheduling, so
book the exam date the day the course starts.

Role after licensing (current scope, revisit in Stage 2): **Tracy holds the contracts — only
that, for now.** She is the licensed seat the recruited-agent contracts and carrier
appointments hang on. Case design, mentorship, the wholesaler desk, and the public voice of
the agency are explicitly NOT her job in Stage 1 — those belong to Luke, Jay, and the front
man (§8).

## 7. The CPA / COI channel — CPE seminars

The engine behind Channel 3, and a mentorship deliverable for Channel 2:

- **Luke and Jay build a CPA network by delivering CPE seminars.** CPAs owe 40 hours/year of
  continuing education; a registered sponsor's live seminar is something their calendar
  actually wants. Luke and Jay present advanced-planning topics CPAs get scored on all day —
  the OBBBA AMT trap, business-succession funding, estate liquidity under the $15M exemption —
  and become the insurance people the room calls when a client's case crosses their desk.
- **Why CPAs:** a CPA referral arrives pre-trusted, pre-qualified, and already sized — the
  average advanced case referred by a CPA is exactly the $50K-commission personal case
  Channel 3 is built on. One productive CPA relationship ≈ 2–4 referred cases/year.
- **Mechanics:** register (or partner) as a CPE sponsor for live events; run one seminar/month
  from Stage 1; every attendee gets the client-facing one-pagers from the Case Atlas Library
  (concept marketing built for exactly this) and a direct line to the PeakBritt case desk.
- **The multiplier:** the same system is packaged and taught to contracted producers — "get
  professional referrals from centers of influence" becomes a mentorship module (deck, script,
  seminar-in-a-box from docs/29 §10). An agent who learns to work COI referrals stops needing
  bought leads forever — which is both the strongest retention hook in the offer and the
  strongest proof that the mentorship is real.

## 8. The front man — the investor, during the transition

- **What:** one consistent public face for PeakBritt: delivers the commercials (docs/29),
  hosts the webinars, fronts the YouTube channel, voices the brand. Luke and Jay appear as
  the million-dollar mentors they are; the front man carries the show.
- **Who (updated with the $300K raise — docs/30-investor-pack-300k.md):** **the investor
  serves as the front man while we transition** (target: months 1–9, extendable by mutual
  agreement). The role is formalized in a services agreement alongside the investment —
  defined shoot days and webinars per month, a defined window, and a succession plan that
  converts the role to a hired voice once Stage-2 revenue supports it. An advisor option
  grant (0.5–1.0%, vesting monthly over the service period) compensates the services
  separately from the invested capital.
- **Magellan Financial in-kind (upline partner — NOT the investor):** video production and
  marketing resources — studio/shoot capability, editing, creative support — are provided at
  no cash cost to PeakBritt by Magellan Financial through the upline partnership, independent
  of the investment. Brand wall holds: Magellan Financial appears in investor and partnership
  documents only, never in consumer- or agent-facing assets.
- **Why this alignment works:** producers' calendars monetize at ~$45K/personal case and in
  mentorship overrides — not in retake sessions — and the investor's stake appreciates on
  exactly the metrics the front-man role drives (subscribers, applications, contracted
  producers). Everyone is paid by the same scoreboard, and the brand gets one consistent
  face from the first ad onward.
- **Succession profile (the Stage-2 hire, decided on data at month 9):** on-camera comfort,
  insurance literacy, sales-psychology fluency; comfortable delivering scripts with the NLP
  structure intact (docs/29 is written to be delivered, not improvised).

## 9. Why agents fail — and why this offer is built the way it is

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
| Isolation | Weekly 1-on-1 with Luke or Jay, a case desk that answers, Founding Producer cohort |
| Empty "support" promises | The software is the proof — the ad demos it, the trial delivers it, before any contract talk |
| Skepticism of recruiting pitches | Gated, capped, application-only contracting. We say no. Exclusivity is real. |

## 10. Costs, risks, and the honest version

**Stage-1 monthly cost envelope:** ads $3–6K (media only — **video production and marketing
resources are provided in-kind by our upline partner Magellan Financial**),
tools/hosting/AI <$1K, Tracy licensing one-time <$1.5K, founder + Tracy time (sweat).
Break-even on cash costs at ~25 subscribers — everything past that funds ad scale.

**Capital:** a **$300K investment** funds the year — full use-of-funds, quarterly P&L with
COGS and EBITDA, proposed terms, and the investor's front-man services role are in
**docs/30-investor-pack-300k.md**. Headline: ~$654K Year-1 revenue under plan, 94% gross
margin, ~$241K EBITDA after explicit founder draws, breakeven inside Q2, and a downside case
that still lands at a ~$40K/mo run-rate one quarter late.

**Top risks:**
1. **Founder-calendar bottleneck** — 1-on-1 mentorship doesn't scale. Mitigation: Stage-2
   productization, cohort layer, production floor to keep the roster small and productive.
2. **Override concentration** — 15 cases/mo across ~10 producers means one defection hurts.
   Mitigation: mentorship relationship + no-cost software = switching cost; contract terms with
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
