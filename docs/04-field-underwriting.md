# Field Underwriting Questionnaire

## Purpose
This is the data layer Atlas (the bot) collects from the agent about the client. Two separate intake flows: one for life insurance (fully underwritten) and one for annuity (financially underwritten). The data flows into the underwriting class estimation, the strategy feasibility check, the wholesaler handoff, and the eligibility gates that drive the pivot-to-alternative logic.

**This doc is what the developer builds against.** It includes the question sets, the parsing logic, the underwriting class estimation, the eligibility gates, and the worked examples.

---

## 1. Two Separate Intakes

**Life insurance intake** — fully underwritten. The agent asks the client a set of health, build, and lifestyle questions. The data flows into the underwriting class estimation (Preferred Plus, Preferred, Standard Plus, Standard, Table 2-8).

**Annuity intake** — financially underwritten. No medical questions. The agent asks about liquid net worth, source of funds, allocation amount, age, income timeline, existing contracts, and estate planning intent.

**Atlas triggers the appropriate intake based on the strategy recommendation.** If the recommendation is life-insurance-funded, the life intake runs. If it's annuity-funded, the annuity intake runs. If the recommendation is a hybrid (e.g., SPIA bridge), both run.

---

## 2. Life Insurance Intake (12 Questions)

The intake is conversational. Atlas asks one question at a time. The agent can answer in their own words, and Atlas parses the response.

### Q1: Age and Date of Birth
> "What's their date of birth?"

**Why it matters:** Drives every underwriting class boundary. Preferred Plus typically requires age 18-70. Standard typically up to 75-80. Table ratings available beyond that but the strategy math may not work.

**Underwriting class impact:** Younger = better class possible. Older = more limited class options.

### Q2: Height and Weight
> "How tall are they and what do they weigh?"

**Why it matters:** Build chart is the second-biggest underwriting driver after age. The build chart converts height/weight to a BMI bucket, which maps to the underwriting class.

**Underwriting class impact:** Within standard build range = no build penalty. Above the limit = Table 2-4. Below the limit = Table 2-4 the other direction.

### Q3: Tobacco Status
> "Tobacco user? Cigarettes, cigars, dip, vape, marijuana — and how often?"

**Why it matters:** Tobacco status is one of the biggest underwriting drivers. Even "occasional cigar" (1-2 per month) typically disqualifies Preferred Plus in most carriers. Marijuana is carrier-specific — some treat any use as tobacco, some don't.

**Underwriting class impact:**
- Non-tobacco (no use in 12+ months) = eligible for Preferred Plus
- Occasional cigar (1-12 per year) = drops to Preferred in some carriers, Standard in others
- Regular cigar (12+ per year) = tobacco rates (Standard to Table 2)
- Any cigarette in 12 months = tobacco rates
- Marijuana (any frequency) = carrier-specific

### Q4: Current Medications
> "Are they on any medications right now? List everything — prescriptions, over-the-counter, supplements."

**Why it matters:** Each medication maps to a condition. The condition drives the rating. Common medications and what they signal:
- Lisinopril, losartan, metoprolol → hypertension (Standard to Table 2-3)
- Metformin, glipizide → diabetes (Standard to Table 2-6)
- Atorvastatin, simvastatin → high cholesterol (often Preferred if controlled)
- SSRIs (sertraline, fluoxetine) → depression/anxiety (Standard to Table 2-4 depending on severity)
- Adderall, Vyvanse → ADHD (often Standard)

**Underwriting class impact:** Each condition has a typical rating range. The combination matters — well-controlled hypertension + well-controlled cholesterol might still be Preferred. Hypertension + diabetes usually isn't.

### Q5: Major Diagnoses in Last 10 Years
> "Any major diagnoses in the last 10 years? Heart disease, cancer, stroke, diabetes, lung disease, liver disease, kidney disease, autoimmune conditions, mental health hospitalizations?"

**Why it matters:** Major diagnoses drive significant ratings or post-pone periods. Cancer history often has a 5-10 year post-pone period depending on type and stage.

**Underwriting class impact:**
- Heart attack or stroke = usually post-pone 1-2 years, then Table 4-8
- Cancer = depends on type and stage; many have 5-10 year post-pone
- Diabetes (Type 1) = Table 4-6 typically
- Diabetes (Type 2, well-controlled) = Standard to Table 2
- Autoimmune (lupus, RA, MS) = Table 4-8 typically
- Mental health hospitalization = carrier-specific, often Standard

### Q6: Hospitalizations or Surgeries in Last 5 Years
> "Any hospitalizations or surgeries in the last 5 years?"

**Why it matters:** Hospitalizations often correlate with significant conditions the agent didn't catch in Q5. Surgeries can trigger re-underwriting of related systems.

**Underwriting class impact:** Recent major surgery = possible post-pone, then rating based on underlying condition.

### Q7: Family History
> "Did any parent or sibling die before age 60 from heart disease, cancer, or stroke?"

**Why it matters:** Family history of early death is a Preferred Plus disqualifier in most carriers. Some carriers care more than others.

**Underwriting class impact:** Parent/sibling death before 60 from cardiac or cancer = drops to Preferred typically. Two or more family members = drops further.

### Q8: Occupation
> "What do they do for a living?"

**Why it matters:** Hazardous occupations get rated. Pilots, commercial divers, loggers, underground miners, race car drivers all get automatic ratings.

**Underwriting class impact:** Standard office work = no impact. Hazardous occupation = Table 2-4. High-hazard (military, offshore) = Table 4-6 or post-pone.

### Q9: Hobbies
> "Any hobbies that involve risk? Aviation, racing, scuba, climbing, skydiving, hang gliding?"

**Why it matters:** Same as occupation — hazardous hobbies get rated.

**Underwriting class impact:** Recreational scuba (to standard depths) = no impact. Private pilot = Table 2. Skydiving = Table 4-6 or post-pone.

### Q10: DUI or Moving Violations in Last 5 Years
> "Any DUI or reckless driving in the last 5 years? Any moving violations?"

**Why it matters:** DUI = automatic Standard or worse in most carriers. Multiple DUIs = post-pone or decline. Moving violations rarely impact but DUIs do.

**Underwriting class impact:** Single DUI 5+ years ago = often Standard. DUI within 3 years = often Table 2-4. Multiple DUIs = often decline.

### Q11: Foreign Travel in Next 12 Months
> "Any foreign travel planned in the next 12 months? If so, where?"

**Why it matters:** Travel to certain countries triggers additional underwriting. High-risk countries (per carrier lists) can post-pone or require exclusions.

**Underwriting class impact:** Travel to most countries = no impact. Travel to sanctioned or high-risk countries = possible exclusion or post-pone.

### Q12: Current Life Insurance in Force
> "Do they have any life insurance in force right now? With which carriers? Any rated policies?"

**Why it matters:** Existing insurance in force is fine, but the agent needs to know about it for the case design. If the client is replacing existing coverage, replacement rules apply (notice requirements, comparison illustrations). Rated policies may indicate the client has a known condition the agent should also document.

**Underwriting class impact:** No direct impact. But the agent needs to know for proper case design and to avoid replacement violations.

---

## 3. Underwriting Class Estimation

After the 12 questions, Atlas produces a **likely underwriting class estimate** with a confidence range:

| Client profile | Likely class | Confidence |
|---|---|---|
| Age 40-65, normal build, non-tobacco, no medications, no major diagnoses, no family history of early death, no hazardous occupation/hobby | **Preferred Plus** | High |
| Same as above but with one minor condition (e.g., mild hypertension well-controlled) | **Preferred** | High |
| Same as above but with 2+ minor conditions or moderate build | **Standard Plus or Standard** | Medium |
| One significant condition (e.g., Type 2 diabetes well-controlled) | **Standard to Table 2** | Medium |
| Multiple significant conditions or one major condition | **Table 2-4** | Medium |
| Severe conditions or recent major diagnosis | **Table 4-8 or post-pone** | High |

**Atlas presents the estimate as a range, not a guarantee:** "Based on what you've told me, this client is likely Standard to Table 2 — well within the strategy range for the buy-sell funding. The actual class will be set by the carrier's underwriter after the formal application."

**If the likely class makes the strategy non-viable, Atlas pivots.** Example: a 70-year-old client with a Table 6 likely class is probably not a fit for max-funded permanent life as a retirement income vehicle. Atlas surfaces this and pivots to the annuity alternative.

---

## 4. Annuity Intake (9 Questions)

The annuity intake is shorter because annuities don't require medical underwriting. The questions are about money and timing, not health.

### Q1: Total Liquid Net Worth
> "What's their total liquid net worth? A range is fine — under $250K, $250K-$1M, $1M-$5M, or above $5M?"

**Why it matters:** Drives the maximum allocation. Most carriers and advisors follow a rule of thumb: max 50% of liquid net worth into a single annuity. So a client with $500K liquid can put up to $250K into an annuity. This protects the client from over-concentration in an illiquid product.

**Pivots:** If the client has less than $100K liquid, an annuity is probably not appropriate. Atlas flags this.

### Q2: Source of Funds
> "Where would the money come from? Is it qualified (IRA, 401(k), 403(b)) or non-qualified (savings, brokerage, inheritance)?"

**Why it matters:** Different sources have different rules. Qualified money uses rollover rules (not §1035). Non-qualified money uses §1035 for tax-free exchanges between annuities.

**Pivots:**
- Qualified source + wants annuity income → SPIA or QLAC
- Non-qualified source + wants repositioning → §1035 exchange
- Mixed source → ask for the specific split

### Q3: Amount They're Considering Allocating
> "How much are they thinking about putting in?"

**Why it matters:** Cross-checks against Q1 (max 50% of liquid). If the proposed amount exceeds the threshold, Atlas flags it: "That would be more than 50% of their liquid net worth. Most advisors recommend keeping it at 50% or below to avoid over-concentration in an illiquid product."

### Q4: Age
> "How old are they?"

**Why it matters:** Annuity pricing is age-driven. SPIA payouts are higher at older ages. QLAC has age limits (must start by 85). Deferred annuities have different surrender structures based on age at issue.

### Q5: Desired Income Start Date
> "When do they want the income to start? Immediately, in 5 years, at age 65, at age 70?"

**Why it matters:** Drives the product type:
- Immediately → SPIA
- Deferred to a specific age → Deferred Income Annuity (DIA) or QLAC
- Deferred accumulation (no income yet, just growth) → Deferred Annuity

### Q6: Existing Annuity Contracts
> "Do they have any existing annuity contracts? If so, what type and with which carrier?"

**Why it matters:** Existing contracts may be candidates for repositioning via §1035. Atlas may recommend a §1035 exchange of an old annuity into a more efficient structure. But §1035 is only valid Annuity→Annuity, Annuity→LTC, or Life→Annuuity — NEVER Annuity→Life.

### Q7: Tax Bracket
> "Roughly what tax bracket are they in? Under 22%, 22-32%, 32-37%, or above 37%?"

**Why it matters:** Annuity withdrawals are taxed as ordinary income. A client in a 37% bracket has a stronger case for repositioning qualified money into a more tax-efficient structure (like the SPIA bridge to life insurance) than a client in a 12% bracket.

### Q8: Estate Planning Intent
> "Is the goal to leave a legacy to heirs, or just income for themselves?"

**Why it matters:** This drives whether the recommendation is income-focused (SPIA) or legacy-focused (positioned for a death benefit, which means life insurance, not annuity). The agent may have meant "annuity" when the right answer is "life insurance with annuity funding the premiums via the SPIA bridge."

**Pivots:** If legacy intent is strong, Atlas pivots from "buy an annuity" to "reposition qualified money through the SPIA bridge into life insurance held in an ILIT."

### Q9: Liquidity Tolerance
> "How important is it that they can access the full amount without penalty in the next 5-7 years?"

**Why it matters:** Annuities have surrender periods (typically 7-10 years) with declining surrender charges. If the client needs liquidity, a deferred annuity with a long surrender period isn't a fit. Atlas may pivot to:
- A SPIA (no surrender period, but the client gives up access to the principal in exchange for the income stream)
- A short-surrender deferred annuity
- Or away from annuities entirely toward more liquid products

---

## 5. The Eligibility Gates

After the intake, Atlas cross-references the answers against the eligibility gates for each strategy. If a gate fails, Atlas pivots to the alternative.

| Gate | What fails | Pivot |
|---|---|---|
| **Age too high** | Age > 80 for most life strategies; > 75 for buy-sell; > 85 for QLAC | Annuity pivot (SPIA, QLAC, deferred annuity) |
| **Health too poor** | Likely Table 6+ for the strategy required | Annuity pivot (no medical underwriting); or wait for improved health; or rated-policy strategy |
| **Build out of range** | Build chart too high or too low for any carrier | Annuity pivot; or Table-rated life strategy with adjusted face amount |
| **Tobacco** | Tobacco use makes the strategy cost-prohibitive at this age | Non-tobacco-rate strategies; or annuity pivot |
| **No co-owners** | Buy-sell requires co-owners | Skip buy-sell; consider other business-owner strategies (COLI, REBA, phantom stock) |
| **No key employees** | REBA, COLI, key person require key employees | Skip those; consider owner-only strategies (SPWL, survivorship, estate funding) |
| **No qualified funds** | Quiet Wealth Transfer requires large qualified balance | Skip QWT; consider other strategies |
| **Liquid net worth too low** | Annuity requires $100K+ liquid | Skip annuity; consider term life or simpler strategies |
| **Estate below exemption** | Estate funding requires estate near/above exemption | Skip estate funding; consider income or business strategies instead |

**Atlas never recommends a strategy that fails a gate without first surfacing the alternative.**

---

## 6. The Pivot-to-Alternative Trigger (Connected to the Intake Flow)

This is the same pivot engine described in the intake flow doc, but it gets triggered by the underwriting data, not the avatar classification. The pivot is structured the same way:

> "This client is 78 with Type 2 diabetes. The buy-sell you mentioned doesn't fit — they're outside the age range and the health is a barrier to the life insurance funding it. But look at this annuity strategy instead — here's why it fits, here's how it would work, here's what you'd need from the client."

**The pivot follows the same 9 hard rules.** No direct annuity-to-life §1035 (must use SPIA bridge). No spouse IRA funding joint LTC. Etc.

---

## 7. The COI (Center of Influence) Action

Some strategies require a CPA, attorney, or trust professional in the conversation before implementation. Atlas surfaces this as part of the recommendation.

**For life insurance strategies requiring a trust (ILIT):**
> "This strategy requires an irrevocable life insurance trust to hold the policy. The agent will need an attorney to draft the trust, and the trust will need a separate trustee. Does the agent have these relationships? If not, here's a script to start one."

**For strategies requiring a CPA (Cash Balance, REBA deductibility, COLI balance-sheet treatment):**
> "This strategy needs a CPA sign-off on the [specific thing — e.g., §162 bonus deductibility, COLI balance-sheet treatment, AMT impact]. Does the agent have a CPA relationship with this client? If not, here's a script to start one — and here are the specific questions the CPA needs to weigh in on."

**The agency helps the AGENT build COI relationships.** The agency does not have a CPA on staff. Atlas never implies the agency provides CPA services.

---

## 8. The Wholesaler Handoff Integration

Once the underwriting data is collected, Atlas attaches it to the wholesaler handoff email (see Wholesaler Handoff Template doc). The wholesaler sees the client profile, the strategy requested, the estimated face amount, and the likely underwriting class — so they can pre-quote illustrations without re-asking the agent for the basics.

**The agent doesn't have to re-type the data.** Atlas populates the email from the intake responses.

---

## 9. Edge Cases

**Edge case 1: Client is 78 with multiple health conditions.**
Atlas runs the life intake, sees the age gate fail, runs the annuity intake, and pivots to SPIA or QLAC. The agent is told: "Life insurance isn't going to be cost-effective for this client. Here's the annuity strategy that fits."

**Edge case 2: Client is a heavy tobacco user and the strategy requires Preferred Plus.**
Atlas runs the life intake, sees the tobacco gate, and surfaces: "Tobacco rates will apply. The strategy still works, but the premium will be 2-3x higher than the non-tobacco illustration. Here's the adjusted case value and commission impact."

**Edge case 3: Client has no liquid net worth and no qualified funds, but has a small whole life policy they're paying premiums on.**
Atlas surfaces the option to use the existing policy as a §1035 source (Life→Annuity is valid). But Atlas also flags the surrender charges and the cost of replacement.

**Edge case 4: Client's family history is severe (parent and sibling both died before 55 from cardiac).**
Atlas runs the life intake, sees the family history gate, and surfaces: "Family history will likely drop the class to Preferred at best. The strategy still works — here's the adjusted case value. The wholesaler will confirm the actual class."

---

## 10. What the Dev Builds Against This Doc

- **Two state machines** — one for the life intake, one for the annuity intake
- **An underwriting class estimator** — maps the 12 life answers to a class range with confidence
- **An eligibility gate checker** — runs every gate against the client data
- **A pivot engine** (shared with the intake flow) — triggers on gate failure
- **A COI action surfacer** — flags strategies requiring CPA, attorney, or trust professional
- **A wholesaler handoff populator** — attaches the intake data to the email template
- **A compliance filter** (shared) — every output filtered
- **A re-prompt handler** — if the agent gives an ambiguous answer, Atlas asks for clarification before moving on
- **An audit log** — every intake, every answer, every gate check, every pivot, every handoff is logged

**All inputs and outputs are auditable.** This is the substrate the Learning Loop (Phase 5) reads from. When the human team reviews a recommendation on a call, they can see exactly what data drove the recommendation — and modify either the data or the recommendation itself.

---

*Last updated: June 30, 2026. Default underwriting class estimation: conservative. Default close rate: 40%. All other assumptions marked in the build status doc.*
