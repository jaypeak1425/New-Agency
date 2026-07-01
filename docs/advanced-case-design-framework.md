Advanced Case Design Framework
A scenario-matching reference for an AI-driven advanced planning application
1. Purpose & App Concept
This document is the knowledge layer for an advanced planning application. The agent or advisor enters a client scenario in plain language (“I've got a guy who is…”). The app parses the scenario into structured parameters, scores it against the strategy library below, and returns ranked strategy recommendations — each with the legal basis, the mechanics, and a set of questions the agent can take back to their upline/wholesaler to position the case.
Section 2 defines the structured input fields (the parser target). Section 3 is the strategy library (the matching database). Section 4 walks the $50M / age-50 example end-to-end. Section 5 sketches the matching logic for the eventual code build.
2. Scenario Input Parameters (Parser Target Schema)
Every “I've got a guy” scenario should be normalized into these fields before matching:
Demographics: age, health/insurability class, marital status, state of residence (state estate tax exposure)
Net worth: total net worth, liquid vs. illiquid split, estate value relative to $15M single / $30M married federal exemption (2026, OBBBA-permanent, inflation-indexed)
Asset profile: business owner (Y/N), concentrated low-basis position (Y/N), real estate/illiquid holdings (Y/N)
Primary goal: minimize estate tax / maximize tax-free transfer / business succession / key-employee retention / charitable intent / supplemental retirement income / estate liquidity
Beneficiary structure: spouse only, children, grandchildren/multi-generational, charity
Control preference: willing to fully relinquish control (outright gift) vs. wants retained access/control (SLAT, FLP, split-dollar loan)
Funding preference: willing to gift/use exemption vs. prefers financing/loan structures vs. wants employer-funded (executive benefit)
Existing structures: existing ILIT, grantor trust, qualified plan, or business entity already in place
Urgency driver: legislative/exemption-sunset concern, liquidity event, health change, business sale, generational transfer event
3. Strategy Library
Each row below is a candidate recommendation. Full mechanics, why-used rationale, and upline/wholesaler questions for each strategy are detailed in Section 3.1 below the summary table.
Strategy
Client Trigger Profile
Tax Code / Legal Basis
App Matching Parameters
Irrevocable Life Insurance Trust (ILIT) — Foundation Wrapper
Any client whose estate (current or projected) will exceed the federal exemption, or who wants death-benefit proceeds excluded from the taxable estate.
IRC §2042 (proceeds includible if insured retains incidents of ownership) — ILIT avoids this by removing ownership. §2035(a) 3-year rule on transferred-in policies. §2503(b) annual exclusion / Crummey notice requirement (Crummey v. Comm'r, 9th Cir. 1968). Trust must be irrevocable and grantor must retain no incidents of ownership.
estate_value > exemption_threshold; wants_db_outside_estate = true; existing_policy_transfer (flag 3yr rule)
Spousal Lifetime Access Trust (SLAT)
Married high-net-worth client who wants to use lifetime exemption now (use-it-or-lose-it concern) but isn't ready to fully give up indirect access to the funds.
Uses §2010(c) lifetime exemption ($15M/individual, $30M/couple in 2026 per OBBBA). Grantor trust rules §671-678. Reciprocal trust doctrine risk if spouses create mirror-image SLATs — must differentiate terms. Divorce/death of beneficiary spouse terminates access ("SLAT risk").
married = true; estate_value > 15M_single_or_30M_joint; wants_indirect_access = true; uses_lifetime_exemption = true
Dynasty Trust / GST-Exempt Trust
Client wants wealth to skip multiple generations (children → grandchildren → great-grandchildren) without re-taxation at each generational transfer.
IRC §2601-2663 (GST tax, 40% flat rate on skip transfers). GST exemption = $15M/person for 2026, NOT portable between spouses (unlike estate exemption) — must be affirmatively allocated. Rule Against Perpetuities varies by state (relevant to trust duration).
wants_multigenerational = true; grandchildren_or_great_grandchildren_beneficiaries = true; gst_exemption_remaining > 0
Premium Financed Life Insurance
High-net-worth/illiquid-asset client (real estate, business owner) who wants a large death benefit without disrupting cash flow or liquidating appreciating assets to pay premiums.
Loan must carry adequate stated interest or §7872 below-market loan imputed-interest rules apply (if private/intra-family financing). Collateral assignment does not, by itself, cause estate inclusion if ILIT is the policy owner/applicant from inception. Interest rate risk and collateral calls are the primary structural risk, not a tax-code risk.
death_benefit_target > 5M; client_prefers_financing_over_cash_gifting = true; collateral_assets_available = true; illiquid_net_worth = true
Private Split-Dollar (Loan Regime)
Wealthy client wants a family member or ILIT to own a large policy but wants premium dollars treated as a loan (recoverable) rather than a completed gift.
Treas. Reg. §1.7872-15 (split-dollar loan regime). Loan regime selected (vs. economic benefit regime) when the non-owner (ILIT) is treated as the borrower. AFR under §1274(d) sets minimum interest to avoid imputed gift treatment. Estate includes the loan receivable (not the death benefit) under §2033 if grantor dies before repayment.
wants_to_minimize_gift_tax_usage = true; large_premium_outlay = true; existing_irrevocable_trust = true
Installment Sale to Intentionally Defective Grantor Trust (IDGT)
Business owner or investor with appreciating assets who wants to transfer future growth out of the estate while still being able to seed an ILIT/dynasty trust for life insurance funding.
Grantor trust rules §671-679 (intentionally triggering grantor status, e.g., via a swap power under §675(4)). Rev. Rul. 85-13 (sale to grantor trust is disregarded for income tax). §453 installment sale rules for the note. No gain/loss recognized between grantor and grantor trust.
owns_appreciating_business_or_asset = true; wants_estate_freeze = true; has_existing_grantor_trust = true
Survivorship (Second-to-Die) Life for Estate Liquidity
Married couple with an illiquid taxable estate (real estate, closely held business, art/collectibles) needing cash to pay estate tax at the second death without forced asset sales.
§2056 unlimited marital deduction defers estate tax to the second death (the event survivorship insurance is designed around). Same ILIT/§2042/§2035 framework as standard ILIT planning. Often paired with GST allocation for a dynasty-trust remainder.
married = true; illiquid_estate_assets = true; estate_tax_liquidity_need = true; both_spouses_insurable
Wealth Replacement Trust paired with Charitable Remainder Trust (CRT)
Philanthropically inclined client holding a low-basis, highly appreciated asset (stock, real estate, business interest) who wants income, a charitable deduction, and to preserve an inheritance for heirs.
§664 (CRT qualification — CRAT/CRUT), §170 charitable income tax deduction (present value of remainder interest), §2055/§2522 estate/gift charitable deduction for the remainder. Asset sale inside CRT avoids immediate capital gains under §664's tax-exempt trust status (gain is taxed to donor only as distributed, under 4-tier accounting).
holds_appreciated_low_basis_asset = true; charitable_intent = true; wants_to_preserve_heir_inheritance = true
Family Limited Partnership / LLC (FLP/FLLC) with Discounted Gifting
Business owner or real-estate family wanting to transfer significant value at a reduced gift-tax cost while retaining management control during life.
§2031/§2512 fair market value standard supports valuation discounts (lack of control, lack of marketability) when properly substantiated by independent appraisal. §2704 anti-abuse rules restrict certain restriction-based discounts — entity must have legitimate non-tax business purpose to withstand IRS challenge (cf. Estate of Strangi, Bongard).
owns_family_business_or_real_estate_portfolio = true; wants_to_retain_control = true; discount_planning_acceptable = true
Section 162 Executive Bonus / Restricted Executive Bonus Arrangement (REBA)
Business owner wants to retain or reward a key executive with a benefit funded through the business, without ERISA/qualified-plan nondiscrimination constraints.
Bonus is deductible to employer under §162 as reasonable compensation; taxable income to executive under §61 in the year paid/constructively received. Not subject to ERISA because it's a single/select arrangement using direct compensation rather than a deferred comp plan funding mechanism. No §409A issues because there's no deferral element (REBA restricts collateral access, not receipt of income).
business_owner = true; wants_key_employee_retention = true; avoid_erisa_qualified_plan_complexity = true

3.1 Strategy Detail Sheets
Irrevocable Life Insurance Trust (ILIT) — Foundation Wrapper
Primary Goal: Remove life insurance death benefit (and cash value) from the gross estate; control distribution to heirs.
Mechanics: Irrevocable trust owns and is beneficiary of the policy. Grantor gifts cash to trust (often via Crummey withdrawal rights to qualify as present-interest gifts under the annual exclusion); trustee pays premiums. If grantor transfers an existing policy in, the 3-year lookback applies.
Tax Code / Legal Basis: IRC §2042 (proceeds includible if insured retains incidents of ownership) — ILIT avoids this by removing ownership. §2035(a) 3-year rule on transferred-in policies. §2503(b) annual exclusion / Crummey notice requirement (Crummey v. Comm'r, 9th Cir. 1968). Trust must be irrevocable and grantor must retain no incidents of ownership.
Why It's Used: Single most common chassis for keeping life insurance entirely outside the estate. Pairs with virtually every strategy below.
Upline / Wholesaler Questions:
Is the trust drafted with Crummey withdrawal rights, and is the gifting/notice process documented annually?
If funding with an existing policy, can we structure a new-issue policy instead to avoid the 3-year lookback?
Who is serving as trustee, and is it an independent trustee (avoids grantor-as-trustee incidents-of-ownership risk)?
Spousal Lifetime Access Trust (SLAT)
Primary Goal: Remove assets/life insurance from the estate while preserving indirect family access through the non-grantor spouse as beneficiary.
Mechanics: Grantor spouse creates irrevocable trust for benefit of the other spouse (and often descendants); gifts cash or assets using lifetime exemption; trust can own life insurance on grantor spouse's life. Grantor trust status typically retained so grantor pays income tax (additional tax-free gift to trust).
Tax Code / Legal Basis: Uses §2010(c) lifetime exemption ($15M/individual, $30M/couple in 2026 per OBBBA). Grantor trust rules §671-678. Reciprocal trust doctrine risk if spouses create mirror-image SLATs — must differentiate terms. Divorce/death of beneficiary spouse terminates access ("SLAT risk").
Why It's Used: Premier 2026 strategy: OBBBA made the $15M/$30M exemption permanent, eliminating the prior urgency, but still the leading vehicle to lock in today's exemption against future legislative reduction while funding large survivorship or single-life policies gift-tax-free.
Upline / Wholesaler Questions:
How are we differentiating the two spouses' trusts to avoid the reciprocal trust doctrine being collapsed by the IRS?
What happens to access and policy funding if the beneficiary spouse predeceases or divorce occurs — is there a backup funding plan?
Is the trust intentionally a grantor trust so the grantor's outside income-tax payments aren't treated as additional gifts?
Dynasty Trust / GST-Exempt Trust
Primary Goal: Allocate GST exemption to a long-duration (or perpetual, state-dependent) trust holding life insurance/assets so growth and death benefit avoid estate AND GST tax for generations.
Mechanics: Irrevocable trust (often combined with ILIT/SLAT structure) funded with gifts; grantor allocates GST exemption on Form 709 to the trust at funding. Trust situs chosen in a state permitting long/perpetual trust duration (e.g., SD, DE, NV) and favorable trust income tax treatment.
Tax Code / Legal Basis: IRC §2601-2663 (GST tax, 40% flat rate on skip transfers). GST exemption = $15M/person for 2026, NOT portable between spouses (unlike estate exemption) — must be affirmatively allocated. Rule Against Perpetuities varies by state (relevant to trust duration).
Why It's Used: Multi-generational families with $15M+ per spouse should prioritize GST allocation early — unused GST exemption at death is lost permanently if not allocated to a trust during life.
Upline / Wholesaler Questions:
Has GST exemption been formally allocated on a timely filed Form 709, and is allocation tracked separately from the estate exemption?
What trust situs/state is being used, and does it support the desired trust duration and state income tax treatment?
How is the life insurance death benefit structured to maximize GST leverage relative to gift dollars used?
Premium Financed Life Insurance
Primary Goal: Use third-party or private lender financing to pay premiums, preserving the client's capital for other investments while still funding a large ILIT-owned policy.
Mechanics: Lender loans premiums to the ILIT (or grantor, then loaned to ILIT); policy cash value and/or outside collateral secures the loan; loan interest accrues or is paid; exit strategy (death benefit, cash value, or refinance) repays the loan.
Tax Code / Legal Basis: Loan must carry adequate stated interest or §7872 below-market loan imputed-interest rules apply (if private/intra-family financing). Collateral assignment does not, by itself, cause estate inclusion if ILIT is the policy owner/applicant from inception. Interest rate risk and collateral calls are the primary structural risk, not a tax-code risk.
Why It's Used: Lets ultra-high-net-worth or business-owner clients fund $10M+ death benefits without a current large gift/cash outlay; very common in the $20M+ segment.
Upline / Wholesaler Questions:
What is the current loan rate, and what is the modeled exit strategy if rates rise or the lender calls collateral?
Who is structured as the original applicant/owner of the policy to avoid §2035 inclusion risk?
What collateral cushion is required, and how is that monitored annually?
Private Split-Dollar (Loan Regime)
Primary Goal: Fund a large policy inside an ILIT with minimal gift-tax exposure by structuring premium advances as below-market loans from the grantor to the trust.
Mechanics: Grantor (or grantor trust) loans premium dollars to the ILIT under a split-dollar loan agreement; ILIT owns the policy; loan accrues interest at the AFR; collateral assignment secures repayment to the grantor's estate at death or surrender.
Tax Code / Legal Basis: Treas. Reg. §1.7872-15 (split-dollar loan regime). Loan regime selected (vs. economic benefit regime) when the non-owner (ILIT) is treated as the borrower. AFR under §1274(d) sets minimum interest to avoid imputed gift treatment. Estate includes the loan receivable (not the death benefit) under §2033 if grantor dies before repayment.
Why It's Used: Converts what would otherwise be a taxable gift (premium payment) into a loan, dramatically reducing gift-tax/exemption usage for very large policies.
Upline / Wholesaler Questions:
Is this structured as a loan regime or economic benefit regime split-dollar arrangement, and why?
What AFR is being used, and is the loan documented with a promissory note and collateral assignment?
How does the loan receivable get valued and settled in the grantor's estate?
Installment Sale to Intentionally Defective Grantor Trust (IDGT)
Primary Goal: Freeze the value of the transferred asset in the grantor's estate at the sale price while shifting all future appreciation to the trust, generating cash flow the trust can use for premiums.
Mechanics: Grantor seeds trust with gift (typically 10% of intended sale price), then sells appreciating asset to the trust for a promissory note at the AFR. Because the trust is a "defective" grantor trust for income tax purposes, the sale is not a taxable event and grantor continues paying income tax on trust income (a further tax-free gift to the trust).
Tax Code / Legal Basis: Grantor trust rules §671-679 (intentionally triggering grantor status, e.g., via a swap power under §675(4)). Rev. Rul. 85-13 (sale to grantor trust is disregarded for income tax). §453 installment sale rules for the note. No gain/loss recognized between grantor and grantor trust.
Why It's Used: Premier estate-freeze technique for business owners; the trust's resulting cash flow/asset base can directly fund large life insurance premiums without further gifting.
Upline / Wholesaler Questions:
What seed-gift percentage and note terms (AFR, term, balloon vs. amortizing) are being used to withstand IRS scrutiny on the note-to-equity ratio?
How is the asset being valued for the sale (independent appraisal, discounts applied)?
Is the trust intentionally structured to remain a grantor trust for the life of the strategy, and what swap power is used?
Survivorship (Second-to-Die) Life for Estate Liquidity
Primary Goal: Provide non-taxable liquidity timed to the event (second death) that actually triggers estate tax, at lower cost than two single-life policies.
Mechanics: ILIT applies for and owns a survivorship policy insuring both spouses; death benefit pays only after both have died (when estate tax is actually due, given the unlimited marital deduction defers tax at first death); proceeds non-taxable while held outside the estate.
Tax Code / Legal Basis: §2056 unlimited marital deduction defers estate tax to the second death (the event survivorship insurance is designed around). Same ILIT/§2042/§2035 framework as standard ILIT planning. Often paired with GST allocation for a dynasty-trust remainder.
Why It's Used: Lower cost per death-benefit dollar than single life (joint mortality pricing) and matches the actual liquidity need date — the workhorse strategy for illiquid UHNW estates.
Upline / Wholesaler Questions:
Has the death-benefit amount been modeled against a projected estate tax liability at second death, accounting for exemption growth/inflation indexing?
What underwriting offer applies if one spouse has health impairments — does survivorship pricing still beat dual single-life coverage?
Is the ILIT also positioned to receive a GST allocation so proceeds benefit grandchildren free of estate/GST tax?
Wealth Replacement Trust paired with Charitable Remainder Trust (CRT)
Primary Goal: Convert an appreciated asset into a charitable income stream and current deduction, then use a portion of the resulting cash flow to fund an ILIT that "replaces" the wealth ultimately passing to charity.
Mechanics: Donor transfers appreciated asset to a CRT; CRT sells asset tax-free (trust is tax-exempt), pays donor an income stream for life/term; donor takes a current partial charitable income-tax deduction; a portion of the income stream funds premiums on a policy owned by an ILIT, replacing for heirs the value ultimately going to charity.
Tax Code / Legal Basis: §664 (CRT qualification — CRAT/CRUT), §170 charitable income tax deduction (present value of remainder interest), §2055/§2522 estate/gift charitable deduction for the remainder. Asset sale inside CRT avoids immediate capital gains under §664's tax-exempt trust status (gain is taxed to donor only as distributed, under 4-tier accounting).
Why It's Used: Solves the classic conflict between charitable intent and family inheritance — very effective for concentrated low-basis positions (e.g., founder stock, appreciated real estate).
Upline / Wholesaler Questions:
CRAT or CRUT, and what payout rate satisfies the §664 10% remainder interest test while maximizing donor income?
What is the actual after-tax income stream available to fund ILIT premiums after the CRT's 4-tier taxation on distributions?
Is the wealth-replacement death benefit sized to fully offset the value passing to charity, or only partially?
Family Limited Partnership / LLC (FLP/FLLC) with Discounted Gifting
Primary Goal: Apply lack-of-control and lack-of-marketability discounts to gifted minority interests, leveraging the gift/GST exemption, with resulting cash distributions used to fund ILIT premiums.
Mechanics: Family contributes business/real estate assets to an FLP/FLLC; senior generation retains general partner/managing member control; minority limited partner/member interests are gifted or sold to an ILIT/dynasty trust at a discounted valuation (appraisal-supported); entity distributions to the trust fund life insurance premiums.
Tax Code / Legal Basis: §2031/§2512 fair market value standard supports valuation discounts (lack of control, lack of marketability) when properly substantiated by independent appraisal. §2704 anti-abuse rules restrict certain restriction-based discounts — entity must have legitimate non-tax business purpose to withstand IRS challenge (cf. Estate of Strangi, Bongard).
Why It's Used: Multiplies the effective amount of exemption transferred — common for real estate and operating business families layering into ILIT/dynasty structures.
Upline / Wholesaler Questions:
Is there a documented independent appraisal supporting the discount percentage, and a legitimate non-tax business purpose for the entity?
How are entity distributions timed/sized to reliably fund the ILIT's premium obligations?
What is our audit-defense file (formalities, separate bank accounts, arm's-length operating agreement) in case of IRS challenge?
Section 162 Executive Bonus / Restricted Executive Bonus Arrangement (REBA)
Primary Goal: Employer pays (bonuses) premiums on a policy owned personally by the executive; REBA adds a vesting/restriction to discourage early departure.
Mechanics: Employer pays a bonus (often grossed-up for tax) used by the executive to pay premiums on a policy the executive personally owns; in REBA, an endorsement or restrictive agreement limits the executive's access to cash value until a vesting condition (tenure, performance) is met.
Tax Code / Legal Basis: Bonus is deductible to employer under §162 as reasonable compensation; taxable income to executive under §61 in the year paid/constructively received. Not subject to ERISA because it's a single/select arrangement using direct compensation rather than a deferred comp plan funding mechanism. No §409A issues because there's no deferral element (REBA restricts collateral access, not receipt of income).
Why It's Used: Already an active LFIA program — simplest, least compliance-heavy golden-handcuffs tool for closely held businesses; frequently the entry point before layering in Cash Balance or Corporate Reserve strategies.
Upline / Wholesaler Questions:
Is the bonus grossed up to offset the executive's income tax, and is that documented as reasonable compensation?
What vesting schedule/restrictive covenant is attached under the REBA endorsement?
How does this coordinate with any existing Cash Balance or qualified plan for the same executive?

4. Worked Example
Scenario: “I've got a guy who's 50, healthy, $50M net worth, wants to pass wealth to his beneficiaries non-taxable.”
Parsed parameters: age 50 / preferred health class; net worth $50M (well above the $15M single exemption, so the estate is fully exposed to 40% federal estate tax on the excess — roughly $14M of tax exposure on $35M of overage at today's thresholds); goal = maximize non-taxable transfer to beneficiaries; no stated marital status or control preference given, so the app should prompt for those next.
Top-ranked matches:
ILIT (foundation, always included) — wraps whatever policy is selected so the death benefit sits outside the $50M estate.
If married: SLAT — locks in use of the $15M/$30M exemption now while preserving indirect spousal access; pairs naturally with a large survivorship policy.
Dynasty/GST allocation — at $50M, the client almost certainly wants grandchildren included; GST exemption should be allocated at funding, not left unused.
Premium Financing — at this net worth, financing a large policy preserves capital for the business/investments rather than a large current gift outlay.
If a business or concentrated low-basis asset is involved (follow-up question): Installment Sale to IDGT or FLP/FLLC discounting to seed the ILIT/dynasty trust efficiently.
Output to the agent: a ranked list (above) with the legal citation for each, plus the consolidated upline/wholesaler question set so the agent can bring an informed, structured ask to advanced planning (Luke Britt / Jeremy Britt) rather than a vague “what do we do for a $50M guy” question.
5. Matching Logic Notes (for code build)
Recommended approach for the eventual app: maintain Section 3 as a structured JSON/database record per strategy (trigger conditions, weight, IRC citations, upline questions) rather than free text. Each scenario run produces a parameter object (Section 2 schema) that is scored against each strategy's trigger conditions; strategies above a confidence threshold are returned ranked, with ILIT auto-included as the default wrapper whenever federal exemption is exceeded. Follow-up questions (marital status, control preference, existing structures) should fire automatically when a required parameter is missing rather than guessing. Compliance language rules (non-taxable, while the policy remains in force, no outcome quantification) should be enforced at the output-rendering layer, not the matching layer, so they apply uniformly regardless of which strategy is returned.
Next inputs needed from you to expand this library: additional uploaded strategy documents, any state-specific estate tax overlays you want included (e.g., states with their own estate tax at lower thresholds), and whether the app should also score the 9 active LFIA programs (Cash Balance, Corporate Reserve, QWT, etc.) in the same matching engine alongside these advanced trust strategies.
