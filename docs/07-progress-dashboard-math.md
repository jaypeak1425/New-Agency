# Progress Dashboard Math

## Purpose
The progress dashboard is what the agent sees when they open the app. It shows them the four numbers that matter: this week's pipeline, this year's pipeline, the book-of-business opportunity ("unmined gold"), and what they've closed. The math behind those numbers has to be defensible — based on the agent's actual book, the actual case design, the actual commission math, and the actual close rate.

**This doc is what the developer builds against.** It includes the commission math, the close rate baseline, the pipeline value calculation, the book-of-business opportunity calculation, the four dashboard widgets, the coaching triggers, and the edge cases.

---

## 1. The Four Numbers the Agent Sees

When the agent opens the dashboard, four big numbers are at the top:

1. **This Week's Pipeline** — the expected commission value of every "I've got a guy" scenario the agent is actively working on this week
2. **This Year's Pipeline** — the expected commission value of every scenario the agent has been working on year-to-date
3. **Book-of-Business Opportunity** — the total estimated opportunity sitting in the agent's book of business, calculated from their self-reported data
4. **Closed This Year** — actual commissions earned YTD

**Below those four numbers:** a list of every active scenario with the case details, the status (proposal sent, in underwriting, closed, lost), and the expected commission.

**The dashboard updates in real time as the agent logs activity, closes cases, and adds new prospects.**

---

## 2. Commission Math Engine

Atlas calculates the expected commission for every scenario. The math is based on the case design (the strategy, the face amount, the annual premium, the product type) and a default commission rate table.

### Default Commission Rates (marked `[DEFAULT — REPLACE IF NEEDED]` in the build status doc)

| Product | Default rate | Notes |
|---|---|---|
| Permanent life (whole life, universal life) | **55% of target premium Y1** | Standard for permanent life |
| Term life | **50% of target premium Y1** | Standard for term |
| Survivorship life | **55% of target premium Y1** | Same as single-life permanent |
| Annuity | **2% of premium** | Standard for annuities |
| COLI / face-amount-based | **0.5% of face amount** | Lower rate, larger face |
| §162 Executive Bonus | **55% of target premium Y1** | Treated as a life sale |
| Disability income | **50% of target premium Y1** | Standard for DI |
| LTC / hybrid | **50% of target premium Y1** | Standard for LTC |

**These are conservative defaults.** The actual rate depends on the carrier, the product, the agent's contract, and the year. Atlas uses the defaults unless the agent overrides them in their profile.

### Expected Commission Formula

For a single strategy:
```
Expected Commission = Annual Premium × Commission Rate
```

For a multi-strategy stack (e.g., buy-sell + COLI + REBA):
```
Expected Commission = Sum of (Annual Premium × Commission Rate) for each strategy
```

### Worked Example: The Two-Owner C-Corp

```
Strategy 1: Buy-sell — $52K annual premium × 55% = $28,600
Strategy 2: COLI — $18K annual premium × 55% = $9,900
Strategy 3: REBA — $8K annual premium × 55% = $4,400
─────────────────────────────────────────
Total expected commission Y1: $42,900
```

---

## 3. Close Rate Baseline

The "expected commission value" of a scenario is not the same as the actual commission the agent will earn. The actual commission depends on whether the case closes — and the close rate varies based on the relationship type, the case complexity, and the meeting history.

### Default Close Rates (marked `[DEFAULT — REPLACE IF NEEDED]`)

| Relationship | Default close rate | Notes |
|---|---|---|
| Existing client / strong relationship | **40%** | They've been working with you, they trust you |
| Existing prospect, first meeting | **25%** | They've met you once, the first meeting is discovery |
| Existing prospect, second meeting | **40%** | By the second meeting, you've established rapport |
| Cold lead, first meeting | **15%** | No prior relationship, low trust |
| Cold lead, second meeting | **30%** | They've come back, signal of interest |
| Referral (warm) | **35%** | A trusted contact introduced you, high baseline trust |

**The agent can override the close rate in their profile** — experienced agents often have higher close rates than the defaults, less experienced agents may have lower. Atlas remembers the agent's override and uses it instead.

### Expected Commission Value Formula

```
Expected Commission Value = Expected Commission × Close Rate
```

### Worked Example: The Two-Owner C-Corp

The agent has an existing relationship (met with both owners last month). The second meeting is upcoming, so the close rate for this scenario is **40%**.

```
Total expected commission Y1: $42,900
Close rate: 40%
Expected commission value: $42,900 × 0.40 = $17,160
```

**That's the number that shows up in the dashboard as "this scenario's value."**

---

## 4. The Book-of-Business Opportunity ("Unmined Gold")

The "unmined gold" is the total estimated opportunity sitting in the agent's book of business. It's calculated from the agent's self-reported data on their book.

### The Data the Agent Provides (in Onboarding or Updated Quarterly)

- Total number of clients in book
- Breakdown by avatar:
  - Business owners (and number of co-owned businesses)
  - HNW individuals (estimated)
  - Qualified fund heavy (estimated)
  - Family / Legacy (estimated)
- Average client age range
- Average client net worth range
- Average annual revenue for business-owner clients
- Existing coverage in force (rough estimate)

### The Calculation

Atlas estimates the opportunity using a per-client model. The default model (marked `[DEFAULT — REPLACE IF NEEDED]`):

| Avatar | Estimated annual commission per client (Y1) | Notes |
|---|---|---|
| Business Owner (with co-owners) | $35,000 | Buy-sell + COLI + REBA + phantom stock stack |
| Business Owner (no co-owners) | $12,000 | COLI + REBA + key person only |
| HNW Individual | $8,000 | Survivorship + estate funding + LTC |
| Qualified Fund Heavy | $6,000 | QWT + RMD repositioning + LTC |
| Family / Legacy | $2,500 | Term + permanent + education funding |

**Worked example:**
```
Agent's book (self-reported):
- 40 business owners with co-owners × $35,000 = $1,400,000
- 15 business owners without co-owners × $12,000 = $180,000
- 25 HNW individuals × $8,000 = $200,000
- 30 qualified fund heavy × $6,000 = $180,000
- 50 family/legacy × $2,500 = $125,000
─────────────────────────────────────────
Total book opportunity (Y1): $2,085,000
Apply a 15% "addressable in next 12 months" filter (most won't move in any given year): $312,750
```

**The "addressable" filter is conservative.** Realistically, an agent won't activate every opportunity in a year — they have a sales cycle, a relationship cycle, and a capacity cycle. Atlas uses 15% as the default. The agent can override.

**The dashboard shows the agent two numbers:**
- **Total book opportunity (Y1):** $2,085,000 — what's sitting in the book
- **Addressable in next 12 months:** $312,750 — what they could realistically move on

---

## 5. The Four Dashboard Widgets

### Widget 1: This Week's Pipeline
- Shows the expected commission value of every "active" scenario
- "Active" = the agent has logged activity in the last 7 days, OR the scenario has a meeting scheduled in the next 7 days
- Sorted by expected commission value (highest first)
- Each row: client name, strategy, expected commission value, status, last activity, next action

### Widget 2: This Year's Pipeline
- Shows the expected commission value of every scenario created YTD, regardless of status
- Breakdown: in-progress, in underwriting, closed-won, closed-lost
- Comparison to same period last year (if the agent has prior data)
- Goal tracking: if the agent has set a $250K goal, show "$X closed, $Y in pipeline, $Z to goal"

### Widget 3: Book-of-Business Opportunity
- Shows the total book opportunity and the addressable 12-month number
- Breakdown by avatar
- "You have $312,750 in addressable opportunity in the next 12 months. You've activated $X so far. That's Y% of your addressable book."

### Widget 4: Closed This Year
- Shows actual commissions earned YTD
- Breakdown by product type (permanent life, term, annuity, COLI, REBA, etc.)
- Comparison to same period last year
- Goal tracking

---

## 6. Pipeline Aging System

Atlas tracks how long every scenario has been in the pipeline. Scenarios that have been sitting too long without activity get flagged.

### Aging Triggers

| Time since last activity | Status | Action |
|---|---|---|
| 0-7 days | **Active** | No flag |
| 8-14 days | **Stale** | Atlas surfaces: "The Smith scenario hasn't moved in 8 days. What's the next step?" |
| 15-30 days | **At risk** | Atlas surfaces: "The Smith scenario is at risk. Last activity was [date]. Want to revisit?" |
| 31+ days | **Cold** | Atlas surfaces: "The Smith scenario has gone cold. Should we close it out, or schedule a follow-up?" |

**The agent can override the aging triggers** — some scenarios legitimately take months (e.g., a complex estate plan with a trust attorney). Atlas learns the agent's preferences over time and adjusts.

---

## 7. The Coaching Triggers

Atlas proactively nudges the agent based on the dashboard data. The triggers are designed to keep the agent active without being annoying.

### Trigger 1: Inactivity Nudge
> "You haven't logged activity in 4 days. What happened with the Smith scenario?"

**Frequency:** Once per scenario per 7 days (don't repeat the same nudge on the same scenario).

### Trigger 2: Pipeline Concentration Nudge
> "70% of your pipeline value is in the Smith scenario. Consider activating 2-3 more prospects this week to diversify."

**Frequency:** Once per week, if the top scenario represents >50% of pipeline.

### Trigger 3: Book Activation Nudge
> "You've activated 8% of your addressable book. To hit your $250K goal, you need to activate at least 15% by [date]. Want to see which 5 prospects to prioritize?"

**Frequency:** Once per month.

### Trigger 4: Goal Tracking Nudge
> "You're at $42K closed, $89K in pipeline. To hit your $250K goal, you need to close an additional $119K in [X] months. At your current close rate, that's [N] more scenarios. Want help building the prospecting list?"

**Frequency:** Monthly, when the agent is behind pace.

### Trigger 5: Strategy Diversity Nudge
> "5 of your 6 active scenarios are permanent life. Consider whether any of your qualified-fund-heavy prospects would benefit from a repositioning strategy — that's typically 2-3x the commission value."

**Frequency:** Quarterly, if the agent's pipeline is concentrated in one product type.

---

## 8. Edge Cases

**Edge case 1: Agent overrides commission rate.**
The agent sets a custom commission rate in their profile (e.g., 65% Y1 instead of 55%). Atlas uses the override everywhere. The override is visible in the agent's profile for transparency.

**Edge case 2: Agent overrides close rate.**
Same as above. The agent sets a custom close rate based on their experience. Atlas uses the override.

**Edge case 3: Scenario is multi-year (e.g., a 5-year COLI premium structure).**
Atlas calculates Y1 commission (55% of Y1 premium) and shows ongoing commission (5-10% of premium Y2-5) separately. The dashboard shows both, with the YTD total.

**Edge case 4: Scenario is lost.**
Atlas marks the scenario as closed-lost, removes it from the active pipeline, and captures the loss reason. The dashboard's closed-this-year widget shows losses as a separate line item.

**Edge case 5: Scenario is in underwriting.**
Atlas moves the scenario from "active" to "in underwriting" status. The expected commission value stays in the pipeline (because the case is still alive) but with a "subject to underwriting" note. The agent can manually adjust if the underwriting class comes back lower than estimated.

---

## 9. What the Dev Builds Against This Doc

- **A commission calculator** — uses the default rate table + agent overrides
- **A close rate engine** — uses the default close rate table + agent overrides + relationship type
- **A pipeline value calculator** — multiplies commission × close rate
- **A book-of-business opportunity calculator** — uses the per-avatar model + the addressable filter
- **A pipeline aging tracker** — runs the aging rules against the activity log
- **A coaching trigger engine** — fires the 5 nudges on the right cadence
- **A goal tracking module** — accepts the agent's goal, calculates the gap, surfaces the action needed
- **A comparison view** — YTD vs. prior year, current quarter vs. prior quarter
- **An audit log** — every calculation, every override, every nudge, every click is logged

**All math is auditable.** When the team reviews a case on a call, they can see exactly how the expected commission value was calculated, what commission rate was used, what close rate was applied, and what assumptions the agent overrode.

---

*Last updated: June 30, 2026. Default commission rates: 55% Y1 permanent life, 2% annuity, 0.5% COLI/face. Default close rate: 40% existing relationship, 25% new first meeting. Default book addressable filter: 15%. All other assumptions marked in the build status doc.*
