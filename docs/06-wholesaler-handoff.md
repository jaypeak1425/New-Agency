# Wholesaler Handoff Template

## Purpose
When Atlas (the bot) determines a strategy is viable (age, health, structure, time, ownership all check out), Atlas auto-generates an illustration request email to the wholesaler. The agent reviews the email, clicks "Send to Wholesaler," and the handoff is logged in the system.

**This doc is what the developer builds against.** It includes the full template with all the fields, a worked example, the variations for different scenario types, the compliance review pipeline integration, and the quality checks before Atlas generates the handoff.

---

## 1. When Atlas Triggers a Handoff

Atlas triggers a wholesaler handoff when **all five eligibility gates pass**:

1. **Age gate** — client age is within the strategy's range
2. **Health gate** — likely underwriting class supports the strategy economically
3. **Structure gate** — business structure (or individual status) matches the strategy requirement
4. **Time gate** — there's enough time horizon for the strategy to work
5. **Ownership gate** — co-owners, key employees, or other required parties are present

If any gate fails, Atlas pivots to an alternative (see intake flow doc). The handoff only happens on a viable strategy.

---

## 2. The Full Email Template

The email is structured to give the wholesaler everything they need to pre-quote illustrations without re-asking the agent for the basics. The agent doesn't have to re-type the data — Atlas populates the email from the intake responses and the underwriting questionnaire.

```
To: [Wholesaler Name]
From: [Agent Name]
Date: [Auto-populated]
Re: Illustration Request — [Client Name or Company Name] ([Scenario ID])

──────────────────────────────────────────
CLIENT PROFILE
──────────────────────────────────────────

Primary Insured:
- Name: [Client Name]
- Age / DOB: [Age] / [DOB]
- Build: [Height] / [Weight]
- Tobacco status: [None / Cigarettes / Cigars / Dip / Vape / Marijuana — frequency]
- Current medications: [List]
- Major diagnoses (last 10 years): [List or "None reported"]
- Hospitalizations / surgeries (last 5 years): [List or "None reported"]
- Family history: [Parent/sibling death before 60 — cardiac/cancer/stroke or "None reported"]
- Occupation: [Job title or role]
- Hobbies: [Aviation / racing / scuba / climbing / skydiving / None reported]
- DUI / moving violations (last 5 years): [Yes — details / No]
- Foreign travel planned (next 12 months): [Country list or "None reported"]
- Existing life insurance in force: [Carrier, face amount, type or "None reported"]

Likely Underwriting Class: [Range, e.g., "Preferred Plus to Preferred, subject to formal underwriting"]

Secondary Insured (if applicable, e.g., survivorship, buy-sell partner, spouse):
- [Same structure as above]

──────────────────────────────────────────
BUSINESS CONTEXT (if applicable)
──────────────────────────────────────────

Business Structure: [C-Corp / S-Corp / Partnership / LLC / Sole Prop / N/A]
Ownership: [Owners and percentages, e.g., "50% / 50%"]
Key Employees: [Number and tenure, e.g., "2 key employees, 8+ years each"]
Annual Revenue: [Range or specific]
Existing Buy-Sell: [Yes / No / In place — details]
Existing COLI: [Yes / No / Carrier and face amount]
Existing Key Person Coverage: [Yes / No / Carrier and face amount]
Existing Qualified Plans: [401(k) / Cash Balance / Pension / None]

──────────────────────────────────────────
SCENARIO SUMMARY
──────────────────────────────────────────

Client Type: [Business Owner / HNW Individual / Qualified Fund Heavy / Family-Legacy / Multi-Avatar]
Client Goal: [Their stated primary goal, e.g., "Business continuity + key employee retention + retirement down the road"]
Existing Relationship: [Yes — length / New prospect]
Source: [How the agent found this client, e.g., "Referral from CPA Jane Smith" or "Cold lead from LinkedIn"]

──────────────────────────────────────────
STRATEGY REQUESTED
──────────────────────────────────────────

Primary Strategy: [Strategy name, e.g., "Buy-sell agreement funded with survivorship life on both owners"]

Structure Recommendation: [Cross-purchase / Trusteed cross-purchase / Entity purchase / Stock redemption — please advise on best fit]

Secondary Strategies (paired with primary):
- [e.g., "COLI on both owners + both key employees for company reserve"]
- [e.g., "§162 Executive Bonus / REBA on both key employees, 5-year vesting, double-bonus structure"]
- [e.g., "Phantom stock on both key employees as second retention layer"]

If the agent wants to flag specific carrier preferences or product types, that goes here.

──────────────────────────────────────────
ESTIMATED CASE SIZE
──────────────────────────────────────────

Strategy 1: [Buy-sell]
- Face amount: $[X] per insured ($[Y] total)
- Estimated annual premium: $[Z]
- Policy type: [Permanent / Survivorship / Term / Hybrid]

Strategy 2: [COLI]
- Face amount: $[X] per insured ($[Y] total)
- Estimated annual premium: $[Z]
- Policy type: [Permanent / COLI / Hybrid]

Strategy 3: [REBA]
- Face amount per key employee: $[X]
- Estimated annual premium per key employee: $[Y]
- Total REBA: $[Z]
- Policy type: [Permanent / Term / Hybrid]
- Vesting: [Years and conditions]

Combined estimated annual premium: $[X]
Combined face amount: $[Y]

──────────────────────────────────────────
GOAL
──────────────────────────────────────────

Pre-quote illustrations for client meeting on [Date].
Both owners / Decision-makers in the room: [Yes / No — who's there]
Decision timeline: [When the client expects to make a decision]
Funding source: [Personal / Business / Both]

──────────────────────────────────────────
COMPLIANCE NOTE
──────────────────────────────────────────

For internal illustration purposes only. Final strategy subject to underwriting, full case review, and client decision. All benefit claims non-taxable while the policy remains in force.

──────────────────────────────────────────
AGENT CONTACT
──────────────────────────────────────────

[Agent Name]
[Phone]
[Email]
[IMO / FMO / BGA / GA affiliation]
[State(s) licensed]
```

---

## 3. Worked Example: The Two-Owner C-Corp

This is the same scenario from the intake flow doc. After Atlas runs the intake, classifies the avatars, recommends the strategy stack, and confirms all five eligibility gates pass, Atlas generates this email.

```
To: Sarah Chen, Senior Wholesaler
From: Jay Peak
Date: June 30, 2026
Re: Illustration Request — Smith Industries LLC (50/50 C-Corp) (Scenario #2026-06-30-001)

──────────────────────────────────────────
CLIENT PROFILE
──────────────────────────────────────────

Primary Insured (Owner 1):
- Name: John Smith
- Age / DOB: 50 / 1975-08-12
- Build: 5'10" / 195 lbs
- Tobacco status: None
- Current medications: Lisinopril 10mg (hypertension)
- Major diagnoses (last 10 years): Hypertension diagnosed 2019, well-controlled
- Hospitalizations / surgeries (last 5 years): None
- Family history: Father MI at age 62
- Occupation: Owner / CEO of Smith Industries
- Hobbies: Recreational golf, travel
- DUI / moving violations (last 5 years): None
- Foreign travel planned: None
- Existing life insurance: $500K group term through employer

Likely Underwriting Class: Preferred to Standard Plus (BP medication, family history of early cardiac)

Secondary Insured (Owner 2):
- Name: Mike Johnson
- Age / DOB: 49 / 1976-11-03
- Build: 5'9" / 165 lbs
- Tobacco status: None
- Current medications: None
- Major diagnoses (last 10 years): None
- Hospitalizations / surgeries (last 5 years): None
- Family history: Non-contributory
- Occupation: Owner / COO of Smith Industries
- Hobbies: Marathon running, cycling
- DUI / moving violations (last 5 years): None
- Foreign travel planned: None
- Existing life insurance: $500K group term through employer

Likely Underwriting Class: Preferred Plus

──────────────────────────────────────────
BUSINESS CONTEXT
──────────────────────────────────────────

Business Structure: C-Corp
Ownership: 50% / 50% (John Smith / Mike Johnson)
Key Employees: 2 key employees, ages 35 and 38, 8+ years tenure each
Annual Revenue: $6M
Existing Buy-Sell: None
Existing COLI: None
Existing Key Person Coverage: None
Existing Qualified Plans: 401(k) only

──────────────────────────────────────────
SCENARIO SUMMARY
──────────────────────────────────────────

Client Type: Business Owner + High Net Worth + Family-Legacy
Client Goal: Business continuity + key employee retention + retirement down the road
Existing Relationship: Yes — initial meeting last month
Source: Referral from CPA Tom Wilson

──────────────────────────────────────────
STRATEGY REQUESTED
──────────────────────────────────────────

Primary Strategy: Buy-sell agreement funded with survivorship life on both owners
Structure Recommendation: Trusteed cross-purchase (please advise on best fit for this 50/50 structure)

Secondary Strategies (paired with primary):
- COLI on both owners + both key employees for company reserve (§101(j) notice and consent required before issue)
- §162 Executive Bonus / REBA on both key employees, 5-year vesting, double-bonus structure
- Phantom stock on both key employees as second retention layer

──────────────────────────────────────────
ESTIMATED CASE SIZE
──────────────────────────────────────────

Strategy 1: Buy-sell
- Face amount: $5M survivorship on both owners
- Estimated annual premium: ~$52K
- Policy type: Survivorship permanent (whole life or universal life)

Strategy 2: COLI
- Face amount: $1M total ($500K per owner)
- Estimated annual premium: ~$18K
- Policy type: Corporate-owned permanent life

Strategy 3: REBA
- Face amount per key employee: $250K
- Estimated annual premium per key employee: ~$4K
- Total REBA: ~$8K
- Policy type: Permanent life with restrictive endorsement (5-year vesting)
- Vesting: 5 years, performance + tenure based

Combined estimated annual premium: ~$78K
Combined face amount: ~$6.25M

──────────────────────────────────────────
GOAL
──────────────────────────────────────────

Pre-quote illustrations for client meeting on July 15, 2026.
Both owners will be in the room.
Decision timeline: Implementation within 60 days if they agree.
Funding source: Business pays COLI and REBA premiums; owners fund buy-sell premiums personally (or through the business if structured that way — please advise).

──────────────────────────────────────────
COMPLIANCE NOTE
──────────────────────────────────────────

For internal illustration purposes only. Final strategy subject to underwriting, full case review, and client decision. All benefit claims non-taxable while the policy remains in force.

──────────────────────────────────────────
AGENT CONTACT
──────────────────────────────────────────

Jay Peak
[Phone]
jay@email.com
Peakbritt Financial Group — affiliated with [IMO Name]
Licensed in: [State list]
```

---

## 4. Variations by Scenario Type

The base template is the same, but some fields change based on the scenario type.

### Variation A: Single-Strategy Handoff (e.g., one strategy, one client)
- **Business Context section:** Often omitted (no business)
- **Strategy Requested section:** One strategy only
- **Estimated Case Size section:** One face amount, one premium
- **Goal section:** Simpler, often "Illustrations for client review by [date]"

### Variation B: Multi-Strategy Stack (the worked example above)
- All sections populated
- Strategy Requested section lists all strategies in priority order
- Estimated Case Size section sums all strategies
- Goal section: "Pre-quote illustrations for [meeting type] on [date]"

### Variation C: Annuity Pivot (when life doesn't fit, annuity does)
- **Client Profile section:** Includes the life intake answers (so the wholesaler sees why life didn't fit)
- **Strategy Requested section:** Specifies SPIA, QLAC, or annuity type
- **Estimated Case Size section:** Premium = the lump sum being allocated to the annuity
- **Goal section:** "Income start date [date], allocation [date]"
- **Compliance Note section:** Includes the §1035 vs. SPIA bridge language if repositioning

### Variation D: Qualified Repositioning (Quiet Wealth Transfer)
- **Client Profile section:** Includes the qualified balance details
- **Business Context section:** Often omitted (no business)
- **Strategy Requested section:** Specifies the SPIA bridge + life insurance in ILIT
- **Estimated Case Size section:** Premium = the after-tax income from the SPIA funding the life insurance
- **Compliance Note section:** "Repositioning strategy. Non-taxable while the policy remains in force. Trust-owned to avoid estate inclusion. The agent will need an attorney to draft the ILIT."

---

## 5. The Commission Math Engine

Atlas calculates the expected commission for the scenario and includes it in the email (or a separate note) so the agent and the wholesaler can align on the case value.

**Default commission rates (marked `[DEFAULT — REPLACE IF NEEDED]` in the build status doc):**

| Product | Default rate | Notes |
|---|---|---|
| Permanent life (whole life, universal life) | 55% of target premium Y1 | Standard for permanent life |
| Term life | 50% of target premium Y1 | Standard for term |
| Survivorship life | 50-60% of target premium Y1 | Slightly higher than single-life permanent |
| Annuity | 2% of premium | Standard for annuities |
| COLI / face-amount-based | 0.5% of face amount | Lower rate, larger face |
| §162 Executive Bonus | Same as permanent life (55% Y1) | Treated as a life sale |

**Expected commission calculation (in the email or in the dashboard):**

```
Strategy 1: Buy-sell — $52K annual premium × 55% = $28,600
Strategy 2: COLI — $18K annual premium × 55% = $9,900
Strategy 3: REBA — $8K annual premium × 55% = $4,400
Total expected commission Y1: $42,900
```

The agent sees this in the dashboard. The wholesaler doesn't need to see it (the email is about the case design, not the agent's commission). But the data is in the system.

---

## 6. The Compliance Review Pipeline

Every handoff email passes through the compliance filter before Atlas generates it. The filter checks:

- "Tax-free" → must be "non-taxable"
- Any guarantee language → flagged or rewritten
- Any specific income claim → flagged or rewritten
- Any IRS form number in client-facing copy → flagged
- Any "Firm Advantage" reference → flagged
- Any "CPA on staff" implication → flagged
- "Money-back guarantee" or "premium-back guarantee" → flagged

If the filter catches a violation, Atlas rewrites the output. If the rewrite is impossible, the email is held and the compliance officer is notified.

**The compliance officer reviews the held emails in a queue UI (built in Phase 5).** Cleared emails go out. Rejected emails are sent back to the agent with the compliance notes.

---

## 7. The 5 Quality Checks Before Atlas Generates the Handoff

Atlas runs these checks before generating the email. If any check fails, Atlas surfaces the issue to the agent before generating.

**Check 1: All required client profile fields are populated.**
If the agent skipped a question in the intake, Atlas asks for it before generating the handoff.

**Check 2: The strategy is viable (all 5 eligibility gates pass).**
If the pivot-to-alternative was triggered, the handoff uses the alternative strategy, not the original.

**Check 3: The commission math is consistent with the dashboard defaults.**
If the agent's commission expectations differ from the engine's calculation, Atlas surfaces: "Based on the default 55% Y1 commission, the expected commission for this scenario is $42,900. Is that what you're expecting?"

**Check 4: The COI action has been surfaced.**
If the strategy requires a CPA, attorney, or trust professional, Atlas confirms the COI has been addressed before generating the handoff.

**Check 5: The compliance filter has passed.**
If the email contains any non-compliant language, the filter rewrites it before delivery.

---

## 8. The Wholesaler Relationship Layer

Atlas doesn't pick the wholesaler — the agent does. The agent's IMO / FMO / BGA / GA relationship determines which wholesaler handles the case. The agent's profile (in onboarding) lists:

- Primary IMO affiliation
- Wholesaler contacts (name, email, phone)
- Backup wholesalers for specific product types
- Carrier preferences (if any)

**When Atlas generates a handoff, it pulls the wholesaler from the agent's profile.** If the agent has multiple wholesalers (e.g., one for life, one for annuities, one for specific carriers), Atlas asks: "Which wholesaler should this go to?" before generating.

---

## 9. What the Dev Builds Against This Doc

- **A template engine** — populates the email from the intake + underwriting data
- **A variation handler** — picks the right variation (A, B, C, D) based on scenario type
- **A commission calculator** — uses the dashboard defaults to produce the expected commission
- **A compliance filter** (shared) — runs on every email before delivery
- **A wholesaler router** — pulls the wholesaler from the agent's profile, asks if multiple
- **An audit log** — every handoff, every send, every compliance check, every review is logged
- **A held-emails queue** — for the compliance officer to review
- **An email integration** — Atlas sends via the agent's email, not a no-reply address
- **A "send" confirmation** — the agent reviews and clicks send; Atlas never auto-sends without the agent's approval

**All handoffs are auditable.** This is the substrate the Learning Loop (Phase 5) reads from. When the team reviews a case, they can see exactly what was sent to the wholesaler, what the response was, and what was modified in the next iteration.

---

*Last updated: June 30, 2026. Default commission rates: 55% Y1 permanent life, 2% annuity, 0.5% COLI/face. All other assumptions marked in the build status doc.*
