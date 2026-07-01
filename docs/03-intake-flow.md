# "I've Got a Guy" Intake Flow

## Purpose
This is the conversation layer between the agent (human) and the brain (the locked strategy library). The agent opens the app, types or speaks a client scenario, Atlas (the bot) walks them through a discovery conversation, classifies the prospect into one or more avatars, recommends the right strategies, and hands the agent a packaged next step (a pitch deck, a wholesaler handoff, or a pivot to an alternative).

**This doc is what the developer builds against.** It includes the conversation flow, the underlying logic, the voice, the edge cases, and a worked example.

---

## 1. Bot Identity & Voice

**Bot name:** Atlas
**Voice:** Jay's Adventurer voice — honest, plain-spoken, calm. Conversational, not corporate. Talks to one person, not a crowd.
**Tone of the conversation:** Like a senior producer thinking out loud alongside the agent. Atlas doesn't lecture, doesn't hype, doesn't over-promise. Atlas asks, listens, and recommends.

**Atlas never says:**
- "I guarantee"
- "You will make $X"
- "Tax-free" (always "non-taxable")
- "Money-back guarantee" or "premium-back guarantee"
- Any specific income claim
- Any IRS form number or specific repositioning structure name in client-facing copy

**Atlas always conditions benefit claims with "while the policy remains in force"** in any client-facing output.

---

## 2. The Intake Flow (10 Questions)

The flow is conversational. Atlas doesn't dump all 10 questions at once. Atlas asks one at a time, listens, asks a clarifying follow-up if needed, then moves on. The agent can answer in their own words, and Atlas parses the response.

**Opening line (Atlas says this to start every intake):**
> "Tell me about this person. What's their situation?"

This is open on purpose. Some agents will type a one-line scenario ("Two owners 50/49, C-Corp, want buy-sell and COLI"). Some will type a paragraph. Atlas parses both.

**After the opening, Atlas works through the following 10 questions in order. Atlas asks them one at a time, conversationally:**

### Question 1: Age
> "How old are they?"

**Why this gates everything:** Every strategy has an age floor and ceiling. Atlas uses the answer to open or close strategies immediately.

### Question 2: Health
> "How's their health — good, average, or are there any health issues we should know about?"

**Why this gates everything:** Life insurance funding requires underwriting. The answer drives the underwriting class (Preferred Plus, Preferred, Standard, Table 2-8) and may force a pivot to an annuity alternative.

### Question 3: Tobacco
> "Tobacco user? Cigarettes, cigars, dip, vape, marijuana — and how often?"

**Why this matters:** Tobacco status is one of the biggest underwriting drivers. Even "occasional cigar" can knock a client out of the best class.

### Question 4: Business Owner or Individual
> "Are they a business owner, an employee, or neither?"

**Why this routes the flow:** Business owner → Business Owner avatar activates. Employee or individual → different avatar activates.

### Question 5 (if business owner): Business Structure
> "If they own a business, what's the structure — C-Corp, S-Corp, partnership, LLC, or sole prop?"

**Why this matters:** Different structures unlock different strategies. Buy-sell needs co-owners. COLI is a corporate play. Cash Balance is a defined-benefit plan. Phantom stock needs an equity story.

### Question 6 (if business owner): Co-Owners
> "Are there co-owners? If so, what are their ages and ownership percentages?"

**Why this matters:** Buy-sell is only relevant if there are co-owners. Survivorship life is only relevant for married couples.

### Question 7 (if business owner): Key Employees
> "Are there key employees? How many?"

**Why this matters:** Executive bonus / REBA, COLI, and key person coverage all require key employees to be in the picture.

### Question 8: What They're Trying to Solve
> "What are they trying to solve for — retirement income, business continuity, key employee retention, estate planning, leaving a legacy to family, or all of the above?"

**Why this matters:** This sets the strategy priority. The client might have multiple problems, but the engine needs to know which is most urgent to recommend in the right order.

### Question 9: Existing Relationship
> "Do you have an existing relationship with them, or is this a new prospect?"

**Why this matters:** Close rate baseline differs. Existing relationship = 40% close on recommended scenarios. New prospect = 25% close on first meeting, 40% on second meeting.

### Question 10: Income or Revenue Range
> "Roughly what's their annual income or business revenue? A range is fine — under $250K, $250K-$1M, $1M-$5M, or above $5M?"

**Why this matters:** Case size estimate. Drives the commission math in the dashboard. Also drives the AMT trap diagnostic (the $500K-$1.5M band is a new exposure zone under OBBBA 2026).

---

## 3. The Avatar Classification Step

After the 10 questions, Atlas classifies the prospect into one or more of the 4 avatars:

| Signal in the answers | Avatar activated |
|---|---|
| Has a business with co-owners | **Business Owner** |
| Net worth > $2M (or self-reported) | **High Net Worth** |
| $500K+ in qualified funds (self-reported) | **Qualified Fund Heavy** |
| Has dependents under 18 OR explicit legacy intent | **Family / Legacy** |
| Earner in $500K-$1.5M band (OBBBA AMT trap) | **Diagnostic flag** — surfaced to the agent |

**Most prospects match more than one avatar.** Atlas stacks the avatars in priority order:
1. Business Owner (if business + co-owners)
2. High Net Worth (if $2M+ net worth)
3. Qualified Fund Heavy (if $500K+ in qualified funds)
4. Family / Legacy (if dependents or legacy intent)

**Example:** A 55-year-old C-Corp owner with one co-owner, $3M net worth, $800K in an IRA, two kids in college, and a stated goal of "make sure my family is taken care of if something happens to me" → **Business Owner + High Net Worth + Qualified Fund Heavy + Family/Legacy** (4-avatar stack).

---

## 4. The Strategy Recommendation (Drawing from Part 5 of the Brain)

Atlas looks at the avatar stack and pulls the relevant strategy universe. Then it cross-references against the eligibility gates (age, health, structure, time, ownership %).

**The recommendation output has four parts:**

1. **The primary strategy** (the strongest fit)
2. **Often-paired-with** (the strategies that show up alongside the primary in real case design)
3. **The pitch order** (which strategy to lead with in the sales meeting)
4. **The "why this strategy"** (one sentence per strategy, in client-friendly language)

**Atlas never invents a strategy.** It only recommends from the locked library (9 core + 8 supporting). If Atlas can't find a fit, it says so honestly: "Based on what you've told me, none of the standard strategies are a clean fit for this prospect. Here's the closest one, and here's why it's not perfect — let me know if you want to dig deeper."

---

## 5. The Pivot-to-Alternative Logic

When the primary strategy doesn't fit (age, health, structure, time, ownership %), Atlas pivots. The pivot is structured:

> "This client is 78 with Type 2 diabetes. The buy-sell you mentioned doesn't fit — they're outside the age range and the health is a barrier to the life insurance funding it. But look at this annuity strategy instead — here's why it fits, here's how it would work, here's what you'd need from the client."

**The pivot follows the brain's hard rules:**
- Direct annuity-to-life §1035 is NEVER valid — must route through SPIA bridge
- §1035 is for non-qualified only — qualified money uses rollover rules
- Life-to-life §1035 requires same insured, same owner
- ILIT must be original owner to avoid §2035 3-year lookback
- COLI requires §101(j) notice and consent before issue
- MEC status is irrevocable once triggered
- §162 bonus must be reasonable compensation
- Spouse IRA cannot fund joint LTC — prohibited transaction
- §415(b) limits apply to life inside qualified plans

**Atlas never recommends a strategy that violates any of these 9 hard rules.** The engine-level enforcement catches this before the recommendation is delivered.

---

## 6. The COI (Center of Influence) Action

Some strategies require a CPA, attorney, or other professional in the conversation before implementation. Atlas surfaces this as part of the recommendation:

> "This strategy needs a CPA in the conversation before implementation. Do you have a CPA relationship with this client? If not, here's a script to start one — and here are the specific questions the CPA will need to weigh in on."

**The agency helps the AGENT build COI relationships.** The agency does not have a CPA on staff. This is a feature FOR the agent, not done BY the agency. Atlas never implies the agency provides CPA services.

---

## 7. The Wholesaler Handoff Trigger

When the strategy is viable (age, health, structure, time, ownership all check out), Atlas generates a wholesaler handoff email. The email includes:

- Client profile (age, health status, tobacco, build, key conditions)
- Business context (structure, ownership, key employees, revenue)
- Strategy requested
- Estimated face amount
- Estimated annual premium
- Goal (pre-quote illustration for client meeting on [date])
- Compliance note: "For internal illustration purposes only. Final strategy subject to underwriting and client decision."

The agent reviews the email, clicks "Send to Wholesaler," and the handoff is logged in the system.

---

## 8. The Compliance Filter

Every output that goes to the agent (and every output the agent forwards to a client) passes through the compliance language filter. The filter rejects:

- "Tax-free" (must be "non-taxable")
- "Guaranteed" (in any form)
- Specific income claims
- Specific outcome quantification
- IRS form numbers or specific repositioning structure names
- Any language implying a CPA is on staff
- Any "Firm Advantage" reference
- "Money-back guarantee" or "premium-back guarantee"

If the filter catches a violation, Atlas rewrites the output before delivery. If the rewrite is impossible (the recommendation itself is non-compliant), Atlas refuses the recommendation and surfaces it to the compliance queue.

---

## 9. Worked Example: The Two-Owner C-Corp

**Agent opens the app and types:**
> "I've got a guy. Two owners, 50 and 49, C-Corp, two key employees, average health, one with good health. Want to set up a buy-sell and put money aside in a company reserve. Both make good money, probably $400K each, kids in college."

**Atlas asks Q1 (age):** Already answered (50 and 49). Atlas confirms: "Got it, 50 and 49. How's the 50-year-old's health — good, average, or any health issues?"

**Agent:** "Average. On blood pressure meds, that's it."

**Atlas Q2 (health):** Recorded as average, BP medication.

**Atlas Q3 (tobacco):** "Tobacco user? Cigarettes, cigars, dip, vape, marijuana — and how often?"

**Agent:** "Neither one uses tobacco. 49-year-old is in great shape, runs marathons."

**Atlas Q4 (business owner):** "Are they business owners, employees, or neither?"

**Agent:** "Owners. C-Corp."

**Atlas Q5 (structure):** Already answered (C-Corp). Atlas confirms.

**Atlas Q6 (co-owners):** "Are there co-owners? If so, what are their ages and ownership percentages?"

**Agent:** "Yes, 50/50 split, ages 50 and 49."

**Atlas Q7 (key employees):** "Are there key employees? How many?"

**Agent:** "Two. Both around 35, been with the company 8+ years."

**Atlas Q8 (what they're trying to solve):** "What are they trying to solve for — retirement income, business continuity, key employee retention, estate planning, or all of the above?"

**Agent:** "Business continuity, key employee retention, and they're starting to think about retirement down the road."

**Atlas Q9 (existing relationship):** "Do you have an existing relationship with them, or is this a new prospect?"

**Agent:** "Existing. Met with both of them last month."

**Atlas Q10 (income or revenue range):** "Roughly what's their annual income or business revenue? A range is fine."

**Agent:** "Each owner takes about $400K. Business does about $6M in revenue."

---

**Atlas classifies the avatars:**
- Business Owner ✓ (C-Corp, co-owners, key employees)
- High Net Worth ✓ (combined $800K+ income, $6M revenue business — likely $2M+ net worth)
- Qualified Fund Heavy — unknown (Atlas flags this for the agent: "I don't have visibility into their qualified balances. Worth asking if they have IRAs or 401(k)s with significant balances — that opens up a third strategy.")
- Family / Legacy ✓ (kids in college, stated retirement concern)

**Atlas recommends the strategy stack (in priority order):**

1. **Buy-sell agreement** (primary) — both owners fund permanent life on each other; on second death, surviving owner uses non-taxable death benefit to buy out the deceased's share. ILIT-owned for estate-tax efficiency.
2. **COLI (Corporate Reserve Fund)** — C-Corp purchases corporate-owned life on both owners and the two key employees; cash value grows tax-deferred on the balance sheet; death benefit received income-tax-free (with §101(j) notice and consent before issue). Funds the "company reserve" the client asked for.
3. **Executive Bonus / REBA** — both key employees get a §162 bonus funding personally-owned permanent life; "double bonus" so the benefit is net-neutral to the employee; restrictive endorsement with 5-year vesting creates "golden handcuffs" retention.
4. **Phantom Stock** — for the two key employees as a second retention layer; equity-aligned without giving real equity. Pairs naturally with the REBA.
5. **Estate Funding (Survivorship)** — once the buy-sell is in place, survivorship life on both spouses provides estate liquidity. (Atlas flags this as a future conversation once the buy-sell is implemented.)
6. **Cash Balance Plan** — Atlas flags this as a future conversation once the C-Corp has the buy-sell and COLI in place. The combined owner income + $6M revenue + age 50/49 makes this a strong fit down the road.

**Atlas surfaces the COI action:**
> "This strategy stack needs a CPA in the conversation — the C-Corp's CPA specifically, because the §162 bonus deductibility, the COLI balance-sheet treatment, and the AMT exposure all need a CPA sign-off. Do you have a CPA relationship with this client? If not, here's a script to start one — and here are the specific questions the CPA will need to weigh in on."

**Atlas generates the wholesaler handoff email:**

```
To: [Wholesaler Name]
From: [Agent Name]
Re: Illustration Request — [Client Company Name] (50/50 C-Corp)

Client Profile:
- Owner 1: Age 50, average health, on BP medication, non-tobacco, Preferred likely
- Owner 2: Age 49, excellent health (marathon runner), non-tobacco, Preferred Plus likely
- Two key employees: ages ~35, 8+ years tenure

Business Context:
- C-Corp, 50/50 ownership, $6M annual revenue
- No existing buy-sell
- No existing COLI
- Owners taking $400K each annually

Strategy Requested:
1. Buy-sell agreement funded with survivorship life on both owners (cross-purchase or trusteed cross-purchase — please advise on best structure)
2. COLI on both owners + both key employees for company reserve
3. §162 Executive Bonus / REBA on both key employees, 5-year vesting

Estimated Face Amount:
- Buy-sell: $5M survivorship on both owners
- COLI: $500K per owner ($1M total) + $250K per key employee ($500K total) = $1.5M total COLI
- REBA: $250K per key employee, double-bonus structure

Estimated Annual Premium: ~$78K combined (subject to underwriting)

Goal: Pre-quote illustrations for client meeting on [date]. Both owners will be in the room.

Compliance Note: For internal illustration purposes only. Final strategy subject to underwriting and client decision.
```

**Atlas logs this scenario in the agent's prospecting list, links it to the C-Corp prospect, and updates the progress dashboard:**

- This scenario: Estimated case value $185K annual premium
- This scenario: Estimated commission if closed (assuming 55% Y1 on life) = $42,850
- This scenario: Close rate (existing relationship) = 40%
- Expected commission value of this scenario: $17,140

**The agent walks into the next meeting with:**
- A full case design (5 strategies, prioritized, with the COI action surfaced)
- A wholesaler handoff email ready to send
- A pitch deck draft ready to customize
- A progress dashboard that shows this prospect's expected commission value

**The agent didn't have to think about what to do next. The engine thought. The agent executes.**

---

## 10. The Edge Cases

**Edge case 1: Client is too old or too unhealthy for any life insurance strategy.**
Atlas pivots to the annuity universe. Recommends SPIA for income, QLAC, or annuity-based LTC. Uses the annuity intake flow (separate doc) for the data.

**Edge case 2: Client has no business, no co-owners, no key employees, and is under 60 with average health.**
Atlas classifies as Family/Legacy or Qualified Fund Heavy. Recommends term, permanent, education funding, or legacy structures. No buy-sell, no COLI, no REBA in the recommendation.

**Edge case 3: Client is in the $500K-$1.5M AMT trap zone (OBBBA 2026).**
Atlas flags this as a diagnostic entry point. Surfaces Cash Balance Plan as a strong fit (compresses current income, reduces AMT exposure). Also flags Roth Conversion as a complementary strategy.

**Edge case 4: Client is a non-spouse beneficiary of a large IRA.**
Atlas activates the Inheritance Tax Trap diagnostic. Walks the agent through the SECURE Act 10-year rule, the ordinary-income tax to heirs, and the repositioning opportunity (Quiet Wealth Transfer using the SPIA bridge).

**Edge case 5: Agent tries to recommend a strategy that violates the 9 hard rules.**
The engine-level enforcement catches it. Atlas refuses the recommendation and surfaces the conflict to the compliance queue.

---

## 11. The Onboarding Flow (Connected but Separate)

Before an agent runs their first "I've got a guy" scenario, they go through onboarding. Onboarding captures:

- How long they've been in the business
- Average annual income
- Goal income
- Average client profile (business owners, families, HNW, etc.)
- Voice vs. type interaction preference
- PDF vs. PowerPoint vs. one-pager output preference
- Reminder preferences
- Their existing relationships (CPAs, attorneys, IMOs)

Atlas remembers all of it. The 25-year veteran gets a different experience than the 3-year producer. The 80-year-old IMO principal who's never opened a chat interface gets voice-first, simple outputs. The 28-year-old tech-native gets the full dashboard.

The onboarding flow is part of Phase 2 (The Brand) and connects to the intake flow in Phase 3 (The Brain).

---

## 12. What the Dev Builds Against This Doc

- **A conversational chat interface** (text first, voice in Phase 6 polish)
- **A state machine** that walks the agent through the 10 questions
- **An avatar classifier** that maps answers to one or more of the 4 avatars
- **A strategy recommender** that draws from the locked brain library
- **A pivot engine** that triggers when eligibility gates fail
- **A COI action surfacer** that flags strategies requiring a CPA, attorney, or other professional
- **A wholesaler handoff generator** that produces the email
- **A compliance filter** on every output
- **An edge case handler** for the 5 edge cases above (plus future ones the team adds)
- **A progress dashboard hook** that logs every scenario and updates commission math

**All outputs are auditable.** Every recommendation, every pivot, every handoff is logged with timestamp, actor, and the input data that drove it. This is the substrate the Learning Loop (Phase 5) reads from.

---

*Last updated: June 30, 2026. Default bot voice: Jay's Adventurer voice. Default close rate: 40%. All other assumptions marked in the build status doc.*
