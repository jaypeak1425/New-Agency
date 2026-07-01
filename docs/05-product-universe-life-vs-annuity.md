# The 2-Product Universe in Practice — How the Engine Handles the Life-to-Annuity Decision

## Purpose
The brain has 9 core + 8 supporting strategies, and the existing docs cover each strategy deeply. But there's no single document an agent or a developer can read that answers the strategic question: **"When is this client's situation a life insurance play, when is it an annuity play, and when is it a hybrid?"**

This is the single biggest gap in the build right now. The engine can recommend a strategy (buy-sell, QWT, survivorship, etc.), but the strategy itself doesn't always tell the agent whether to fund it with life insurance or with an annuity. This doc closes that gap.

**This doc is what the developer builds against.** It includes the decision tree, the 5 most common product-choice scenarios, the "I don't decide" boundary, the hybrid plays, the pivot triggers, the COI actions, and the compliance language for the product choice.

**Last updated:** June 30, 2026

---

## 1. The Decision Tree (How the Engine Chooses Life vs. Annuity vs. Hybrid)

When the engine has identified a strategy, the next decision is the product. The decision tree walks through 6 gates in order:

### Gate 1: Is the strategy life-only or annuity-only by definition?

**Life-only strategies (no annuity alternative exists):**
- Buy-sell agreement funding
- §162 Executive Bonus / REBA
- Key person coverage
- Survivorship life / estate funding
- Phantom stock (no insurance funding, but paired with life for the key employees)

**Annuity-only strategies (no life alternative exists):**
- QLAC (Qualified Longevity Annuity Contract — must be an annuity)
- SPIA for income (when the goal is guaranteed lifetime income with no legacy intent)
- Immediate annuity repositioning (when the client wants income now, no legacy)

**Hybrid strategies (both products are part of the design):**
- Quiet Wealth Transfer (SPIA bridge to life insurance in ILIT)
- Qualified LTC Funding (often a §1035 annuity-to-LTC hybrid)
- Corporate Reserve Fund (can be COLI, deferred annuity, or a combination)
- RMD Repositioning (often life or annuity, depending on legacy intent)
- Annuity Rescue (annuity to SPIA to life in ILIT)

**If life-only:** the engine goes to the life intake.
**If annuity-only:** the engine goes to the annuity intake.
**If hybrid:** the engine walks the client through both intakes, sequentially, in the right order.

### Gate 2: The age gate (which product world fits?)

- **Under 60:** Life is generally the better product world for most strategies (more product flexibility, longer time horizon, better underwriting classes available)
- **60-70:** Both worlds are possible. The decision depends on health, time horizon, and intent.
- **70-80:** Life is increasingly expensive (or unavailable at preferred classes). Annuity becomes the default for income plays. Life still works for estate funding (survivorship, ILIT) where the death benefit is the goal.
- **80+:** Life is generally out. Annuity is the default for almost everything. The only life play that might still work is small survivorship for estate liquidity, if the estate is genuinely above the exemption.

### Gate 3: The health gate (which product world fits?)

- **Excellent health (Preferred Plus, Preferred):** Life is fully available, at the best classes. The engine leans life.
- **Average health (Standard, Standard Plus):** Life is still available. The engine evaluates the strategy economics — if the rating makes life too expensive, the engine pivots to annuity.
- **Substandard health (Table 2-4):** Life is still possible but expensive. The engine surfaces the cost and may pivot to annuity if the math doesn't work.
- **Substandard health (Table 5+):** Life is generally out for most strategies. The engine pivots to annuity. The only life play that might still work is survivorship for estate liquidity if the estate is genuinely above the exemption.
- **Severe health issues:** Life is out. Annuity is the only product. The engine goes to the annuity intake.

### Gate 4: The liquidity gate (which product world fits?)

- **High liquidity tolerance (client needs access to the full amount in 5-7 years):** Life is fully liquid (cash value via policy loan or withdrawal). Annuity is not (surrender charges). The engine leans life.
- **Medium liquidity tolerance (client is okay with some illiquidity for higher return):** Both worlds are possible. The engine surfaces the trade-off.
- **Low liquidity tolerance (client wants the income stream and is okay giving up access to principal):** Annuity is the right answer. The engine leans annuity, especially for SPIA and QLAC.

### Gate 5: The time horizon gate (which product world fits?)

- **Long time horizon (20+ years):** Both worlds work. Life gives more flexibility. The engine surfaces both options.
- **Medium time horizon (10-20 years):** Both worlds work. The decision depends on the other gates.
- **Short time horizon (5-10 years):** Life is still possible but the cash value hasn't built up enough. Annuity is often better for short time horizons (SPIA for immediate income, deferred annuity for accumulation).
- **Immediate (under 5 years):** Life is generally out for accumulation plays. Annuity is the default. The only life play that might still work is immediate death benefit (term, GUL) for protection, not accumulation.

### Gate 6: The intent gate (which product world fits?)

- **Legacy intent (client wants to leave money to heirs):** Life is the default. Death benefit is income-tax-free. The engine leans life.
- **Income intent (client wants guaranteed lifetime income for themselves):** Annuity is the default. SPIA, DIA, or QLAC. The engine leans annuity.
- **Hybrid intent (client wants both income for themselves and legacy for heirs):** Hybrid play. Often a SPIA for income + survivorship life for the legacy. The engine walks the client through both.

---

## 2. The 5 Most Common Product-Choice Scenarios

These are the scenarios the agent and the engine will encounter most often. Each one has a clear strategic answer.

### Scenario 1: The Pre-Retiree with a $500K IRA Who Wants "Retirement Income"

**Client profile:** Age 60-65, $500K in an IRA, no other qualified funds, no business, wants to retire in 5 years.

**The strategy choice:**
- **Pure annuity (SPIA or QLAC):** Provides guaranteed income for life. No legacy. Tax-deferred growth continues.
- **QWT (SPIA bridge to life in ILIT):** Provides some income (via the SPIA) AND a legacy to heirs (via the death benefit). More complex. Requires the client to be okay with not touching the principal.
- **Stay in the IRA, take RMDs, draw down:** Simplest. No new product. The client draws down the IRA over their lifetime, leaving whatever's left to heirs.

**The engine's logic:**
- If the client has strong legacy intent → recommend QWT (with the SPIA bridge explained)
- If the client wants maximum income and doesn't care about legacy → recommend SPIA or QLAC
- If the client wants simplicity → don't recommend a new product, surface the "stay in the IRA" option

**The COI action:** The client should talk to a CPA about the tax characterization of each option, especially the RMD implications.

### Scenario 2: The 65-Year-Old HNW Family with a $3M Estate

**Client profile:** Age 65, married, $3M net worth, $500K in an IRA, $2M in real estate, no business. Wants to preserve wealth for the kids.

**The strategy choice:**
- **Survivorship life in ILIT:** Provides estate liquidity at the second death. Death benefit is income-tax-free. Premiums can be funded with annual exclusion gifts.
- **QWT (SPIA bridge to life):** Repositions the IRA into a tax-efficient legacy. The SPIA generates taxable income, the after-tax income funds the life premiums.
- **Both:** Survivorship for the estate liquidity, QWT for the qualified fund repositioning. Two separate policies, two separate structures, often in the same ILIT.

**The engine's logic:**
- Survivorship is the foundation (estate liquidity is the bigger problem at $3M net worth)
- QWT is the optimization (the IRA is the most heavily taxed asset, and repositioning it makes sense)
- The two are often done together, with the QWT funding part of the survivorship premium

**The COI action:** The client needs a trust attorney (to draft the ILIT) and a CPA (to weigh in on the QWT tax characterization and the estate liquidity math).

### Scenario 3: The 45-Year-Old Business Owner with a $1M Buy-Sell Obligation

**Client profile:** Age 45, owns 50% of a C-Corp with one co-owner, $5M revenue business, no buy-sell in place.

**The strategy choice:**
- **Cross-purchase with single-life permanent policies:** Each owner buys a policy on the other. At first death, the surviving owner uses the death benefit to buy out the deceased's share.
- **Trusteed cross-purchase:** A trust owns the policies on both owners. At first death, the trust uses the death benefit to buy out the deceased's share. More tax-efficient at higher estate values.
- **Entity purchase (stock redemption):** The corporation owns the policies on both owners. At first death, the corporation uses the death benefit to buy back the deceased's share. Simpler, but potential AMT issues for C-corps.
- **Deferred comp + life insurance:** A combination play that uses a non-qualified deferred compensation plan to fund the buy-sell without requiring the owners to pay the premiums personally.

**The engine's logic:**
- For a 45-year-old with average to good health, single-life permanent or trusteed cross-purchase is the default
- Entity purchase is the simpler structure but has AMT implications the CPA needs to weigh in on
- Deferred comp is for the case where the owners don't have personal cash flow to fund the premiums

**The COI action:** The client needs an attorney (to draft the buy-sell agreement and the trust if applicable) and a CPA (to weigh in on the tax implications of each structure).

**This is a life-only scenario.** No annuity alternative.

### Scenario 4: The 78-Year-Old with Health Issues

**Client profile:** Age 78, Type 2 diabetes, $200K in an IRA, no business, wants to make the money last.

**The strategy choice:**
- **SPIA:** Provides guaranteed lifetime income. The client trades the lump sum for the income stream.
- **QLAC:** Deferral play within the IRA. The client defers a portion of the IRA to start income at age 85 or later, with a higher payout because of the deferral.
- **Hybrid SPIA + something else:** A SPIA for the bulk of the funds, with a smaller piece going to a different strategy.

**The engine's logic:**
- Life is generally out at 78 with diabetes
- Annuity is the default
- SPIA is the simplest and most reliable
- QLAC is the optimization if the client is okay deferring income

**The COI action:** The client should talk to a CPA about the tax characterization of the SPIA income (ordinary income) and the IRMAA implications for Medicare premiums.

**This is an annuity-only scenario.** No life alternative.

### Scenario 5: The 55-Year-Old with $2M in Qualified Funds and a Healthy Estate

**Client profile:** Age 55, married, $2M in 401(k)s and IRAs, $3M in real estate, no business, estate is $5M+ (above the federal exemption for a married couple, even after the OBBBA 2026 changes).

**The strategy choice:**
- **QWT (SPIA bridge to life in ILIT):** Repositions the qualified funds into a tax-efficient legacy. Reduces the income-tax drag on the heirs.
- **Survivorship life in ILIT:** Provides estate liquidity at the second death. The $5M estate will have a tax bill.
- **Both:** QWT for the qualified fund repositioning, survivorship for the estate liquidity. Often done together, with the QWT funding the survivorship premiums.

**The engine's logic:**
- QWT is the optimization (the qualified funds are the most heavily taxed asset)
- Survivorship is the foundation (the estate is above exemption and will need liquidity)
- The two are often done together in the same ILIT

**The COI action:** The client needs a trust attorney (to draft the ILIT) and a CPA (to weigh in on the QWT tax characterization, the AMT implications, the IRMAA implications, and the estate tax math).

**This is a hybrid scenario.** Both products are part of the design.

---

## 3. The "I Don't Decide" Boundary (The Engine's Role vs. The Wholesaler's Role)

This is the most important strategic principle in this doc, and it ties back to the 9 hard rules and the compliance guardrails.

**The engine's role:**
- Recommend the strategy
- Recommend the product direction (life vs. annuity vs. hybrid)
- Surface the COI action (CPA, attorney, trust professional)
- Generate the wholesaler handoff
- Surface the case value and the commission math

**The engine does NOT decide:**
- Which specific carrier to use
- Which specific product within a category (e.g., which IUL or which SPIA variant)
- The actual premium structure (the illustration request goes to the wholesaler, who provides the actual quotes)
- The final strategy (the engine recommends, the agent and the wholesaler and the client decide)

**The wholesaler's role:**
- Take the engine's recommendation and provide actual product illustrations
- Walk the agent and the client through the product details
- Surface any product-specific considerations the engine didn't account for
- Provide the actual underwriting class after formal application
- Sign off on the case design (in coordination with the agent and the client)

**The agent's role:**
- Run the "I've got a guy" scenario in the engine
- Walk the client through the recommendation
- Coordinate the COI (CPA, attorney, trust professional)
- Send the wholesaler handoff
- Make the final pitch to the client
- Manage the relationship through the close

**The client's role:**
- Provide the intake data (age, health, structure, intent)
- Make the final decision
- Provide the funding (premiums)

**The boundary that keeps the engine defensible:** the engine recommends, the human team decides. The engine never says "you MUST buy this." The engine says "based on your situation, here's the product that fits. Here's why. Talk to your wholesaler to confirm. Talk to your CPA about the tax implications. Then decide."

---

## 4. The Hybrid Plays (Cases Where the Answer Is "Both")

Some client situations call for both life and annuity. The engine needs to know how to stack these and in what order.

### Hybrid Play 1: QWT (SPIA bridge to life)
- **Step 1:** SPIA generates taxable income
- **Step 2:** After-tax income funds life premiums
- **Step 3:** Life policy is in an ILIT, owned by the trust as original owner
- **The 9 hard rule:** Direct annuity-to-life §1035 is NEVER valid. The SPIA bridge is mandatory.

### Hybrid Play 2: Survivorship + QWT (in the same ILIT)
- **Step 1:** Survivorship life on both spouses for estate liquidity
- **Step 2:** QWT funded inside the same ILIT (or a separate ILIT) for the qualified fund repositioning
- **The COI action:** The trust attorney drafts the ILIT (or the two ILITs). The CPA weighs in on both the estate tax and the QWT tax characterization.

### Hybrid Play 3: COLI + deferred comp
- **Step 1:** COLI on both owners and key employees for company reserve
- **Step 2:** Deferred comp plan that uses the COLI death benefit to fund the deferred comp obligations
- **The COI action:** The CPA weighs in on the §101(j) notice and consent, the deferred comp plan design, and the AMT implications.

### Hybrid Play 4: Annuity legacy + life for the spouse
- **Step 1:** Annuity with a joint-life payout (income for both spouses, then the survivor)
- **Step 2:** Survivorship life on both spouses for the legacy to heirs
- **The COI action:** The CPA weighs in on the tax characterization of the annuity income vs. the life death benefit.

---

## 5. The Pivot-to-the-Other-Product Triggers

The engine has explicit rules for when to pivot from a life recommendation to an annuity recommendation, or vice versa.

### Triggers that pivot FROM life TO annuity:
- Age gate: 80+ (life is generally out)
- Health gate: Table 5+ (life is generally too expensive)
- Time gate: Under 5 years to need the income (life accumulation hasn't built up)
- Intent gate: Pure income intent, no legacy

### Triggers that pivot FROM annuity TO life:
- Intent gate: Strong legacy intent (annuity income ends at death, life death benefit continues)
- Health gate: Excellent health, age under 70 (life is the better product)
- Estate gate: Estate above exemption, needs liquidity (life is the only product that delivers estate liquidity efficiently)

### Triggers that pivot to a HYBRID:
- Qualified fund gate: $500K+ in qualified funds, age 60+ (QWT is the natural play)
- HNW gate: $2M+ net worth (survivorship + QWT is the natural play)
- Business owner gate: Buy-sell + COLI + REBA + phantom stock (the full business-owner stack is hybrid)

---

## 6. The COI Action When the Answer Is "Both"

When the engine recommends a hybrid, the COI action is bigger than for a single-product recommendation.

**The minimum COI for a hybrid:**
- **CPA:** For the tax characterization of each product, the income tax and estate tax interactions, the AMT and IRMAA implications
- **Trust attorney:** For the ILIT (or multiple ILITs) and the trust documentation
- **Carrier wholesaler:** For the actual product illustrations and the underwriting process

**The engine surfaces all of this in the recommendation output, with a script to start each relationship if the agent doesn't already have one.**

---

## 7. The Compliance Language for the Product Choice

The engine never says:
- "Annuity is better than life"
- "Life is better than annuity"
- "You should buy X"
- "This is the only option"

The engine says:
- "Based on your situation, here's the product that fits. Here's why."
- "Here are the alternatives if the primary product doesn't fit."
- "Talk to your wholesaler to confirm. Talk to your CPA about the tax implications."

**The engine presents the product choice as a recommendation, not a directive.** The agent, the wholesaler, and the client make the final call.

---

## 8. What the Dev Builds Against This Doc

- **A product-choice decision tree** that runs the 6 gates in order
- **A life-only / annuity-only / hybrid classifier** that maps strategies to product worlds
- **A hybrid play sequence** that walks the client through the steps in the right order
- **A pivot engine** that flips the product recommendation when the gates fail
- **An enhanced COI surfacer** that handles the bigger COI needs of hybrid plays
- **A compliance filter** on every product-choice output
- **A scenario library** with the 5 most common product-choice scenarios (and the engine's logic for each)
- **A "I don't decide" boundary** that the engine enforces — the engine never says "you must buy this"

**All product-choice decisions are auditable.** The engine logs every gate, every classifier result, every pivot, every COI surfacing.

---

*Last updated: June 30, 2026. This doc closes the gap between the strategy recommendation (which strategy) and the product recommendation (which product world). The dev can now build the engine end-to-end: intake → strategy recommendation → product-choice decision → product recommendation → wholesaler handoff.*
