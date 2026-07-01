import type { Prisma } from "../src/generated/prisma/client";

// The canonical brain doc (README + Knowledge Base + Quick Reference Index)
// was never delivered into this repo — docs/21-final-handoff.md notes it was
// "provided in the source conversation." This seed data is built from what
// *is* here:
//
//   - The 8 supporting strategies + 2 of the 9 core strategies (Survivorship,
//     Premium Financing) are fully documented in
//     docs/advanced-case-design-framework.md sections 3 and 3.1 — mechanics,
//     legal basis, and upline questions are transcribed directly from there.
//   - The remaining 7 core strategies are named consistently across
//     docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md,
//     and docs/21-final-handoff.md's "9 core strategies" enumeration, but no
//     doc gives their mechanics/legal-basis in the structured form the brain
//     doc would. They're seeded as `pending_content` placeholders — per the
//     Brain Lock rule (CLAUDE.md), the recommendation engine must never
//     surface a pending_content strategy to an agent.
//
// docs/21-final-handoff.md section 7 is the only place the 9 core strategies
// are named as a complete set (5 from Jay: QWT, RMD Repositioning, Roth+Life,
// Annuity Rescue, Qualified LTC; 4 from Luke: Survivorship, Estate Funding,
// Premium Financing, GRATs).
export const strategyLibrarySeed: Array<
  Omit<Prisma.StrategyCreateInput, "id" | "createdAt" | "updatedAt">
> = [
  // ---- Core (documented) ----
  {
    slug: "survivorship-second-to-die",
    name: "Survivorship (Second-to-Die) Life for Estate Liquidity",
    tier: "core",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Married couple with an illiquid taxable estate (real estate, closely held business, art/collectibles) needing cash to pay estate tax at the second death without forced asset sales.",
    legalBasis:
      "§2056 unlimited marital deduction defers estate tax to the second death (the event survivorship insurance is designed around). Same ILIT/§2042/§2035 framework as standard ILIT planning. Often paired with GST allocation for a dynasty-trust remainder.",
    mechanics:
      "ILIT applies for and owns a survivorship policy insuring both spouses; death benefit pays only after both have died (when estate tax is actually due, given the unlimited marital deduction defers tax at first death); proceeds non-taxable while held outside the estate.",
    whyUsed:
      "Lower cost per death-benefit dollar than single life (joint mortality pricing) and matches the actual liquidity need date — the workhorse strategy for illiquid UHNW estates.",
    matchingParameters: [
      "married = true",
      "illiquid_estate_assets = true",
      "estate_tax_liquidity_need = true",
      "both_spouses_insurable",
    ],
    uplineQuestions: [
      "Has the death-benefit amount been modeled against a projected estate tax liability at second death, accounting for exemption growth/inflation indexing?",
      "What underwriting offer applies if one spouse has health impairments — does survivorship pricing still beat dual single-life coverage?",
      "Is the ILIT also positioned to receive a GST allocation so proceeds benefit grandchildren free of estate/GST tax?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
    notes:
      "docs/03-intake-flow.md and docs/15-email-sequence.md both refer to this same strategy as \"Estate Funding (Survivorship)\" — but docs/21-final-handoff.md's core-strategy enumeration lists \"Survivorship\" and \"Estate Funding\" as two separate items. Kept as two records (see the Estate Funding placeholder) pending Jay/Luke's confirmation of whether they're the same strategy under two names.",
  },
  {
    slug: "premium-financed-life-insurance",
    name: "Premium Financed Life Insurance",
    tier: "core",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "High-net-worth/illiquid-asset client (real estate, business owner) who wants a large death benefit without disrupting cash flow or liquidating appreciating assets to pay premiums.",
    legalBasis:
      "Loan must carry adequate stated interest or §7872 below-market loan imputed-interest rules apply (if private/intra-family financing). Collateral assignment does not, by itself, cause estate inclusion if ILIT is the policy owner/applicant from inception. Interest rate risk and collateral calls are the primary structural risk, not a tax-code risk.",
    mechanics:
      "Lender loans premiums to the ILIT (or grantor, then loaned to ILIT); policy cash value and/or outside collateral secures the loan; loan interest accrues or is paid; exit strategy (death benefit, cash value, or refinance) repays the loan.",
    whyUsed:
      "Lets ultra-high-net-worth or business-owner clients fund $10M+ death benefits without a current large gift/cash outlay; very common in the $20M+ segment.",
    matchingParameters: [
      "death_benefit_target > 5M",
      "client_prefers_financing_over_cash_gifting = true",
      "collateral_assets_available = true",
      "illiquid_net_worth = true",
    ],
    uplineQuestions: [
      "What is the current loan rate, and what is the modeled exit strategy if rates rise or the lender calls collateral?",
      "Who is structured as the original applicant/owner of the policy to avoid §2035 inclusion risk?",
      "What collateral cushion is required, and how is that monitored annually?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },

  // ---- Core (pending content) ----
  {
    slug: "estate-funding",
    name: "Estate Funding",
    tier: "core",
    status: "pending_content",
    avatarTags: ["high_net_worth"],
    notes:
      "Named as a distinct core strategy in docs/21-final-handoff.md's enumeration, but docs/03-intake-flow.md and docs/15-email-sequence.md use \"Estate Funding (Survivorship)\" as a single label — may be the same strategy as survivorship-second-to-die under a different name. Needs Jay/Luke to confirm before the recommendation engine treats it as separate. No mechanics/legal-basis content exists in this repo.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/21-final-handoff.md (named only, no mechanics)",
  },
  {
    slug: "grats",
    name: "GRATs (Grantor Retained Annuity Trusts)",
    tier: "core",
    status: "pending_content",
    avatarTags: ["high_net_worth"],
    notes:
      "Named in docs/21-final-handoff.md and docs/00-developer-brief.md's HNW avatar row as one of Luke's core strategies. No mechanics, legal basis, or trigger conditions exist in any doc in this repo.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/21-final-handoff.md (named only, no mechanics)",
  },
  {
    slug: "quiet-wealth-transfer",
    name: "Quiet Wealth Transfer (QWT)",
    tier: "core",
    status: "pending_content",
    avatarTags: ["qualified_fund_heavy"],
    notes:
      "docs/05-product-universe-life-vs-annuity.md gives a one-line mechanic sketch: \"SPIA bridge to life in ILIT — repositions the IRA into a tax-efficient legacy. The SPIA generates taxable income, the after-tax income funds the life premiums.\" That's directional, not the structured mechanics/legal-basis/trigger-condition detail the brain doc format requires — kept as pending_content rather than promoted to documented.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md, docs/07-progress-dashboard-math.md, docs/09-prelaunch-validation.md, docs/11-sales-page.md (named + partial mechanic sketch, no legal basis/trigger conditions)",
  },
  {
    slug: "rmd-repositioning",
    name: "RMD Repositioning",
    tier: "core",
    status: "pending_content",
    avatarTags: ["qualified_fund_heavy"],
    notes:
      "Named repeatedly (docs/00, 05, 07, 11) as a Qualified-Fund-Heavy strategy, always paired with QWT/Roth+Life in a list — no doc gives its own distinct mechanics or legal basis.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md (named only, no mechanics)",
  },
  {
    slug: "roth-plus-life",
    name: "Roth+Life",
    tier: "core",
    status: "pending_content",
    avatarTags: ["qualified_fund_heavy"],
    notes:
      "Named repeatedly as a Qualified-Fund-Heavy strategy alongside QWT and RMD Repositioning — no mechanics or legal basis documented anywhere in this repo.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md (named only, no mechanics)",
  },
  {
    slug: "annuity-rescue",
    name: "Annuity Rescue",
    tier: "core",
    status: "pending_content",
    avatarTags: ["qualified_fund_heavy"],
    notes:
      "Directly implicated by hard rule #1 (direct annuity-to-life §1035 is never valid — must route through a SPIA bridge funding life premiums inside an ILIT), so the shape of the mechanic is constrained even without full documentation. Kept pending_content since no doc spells out the full structure, legal basis, or trigger conditions in the brain-doc format.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md, CLAUDE.md hard rule #1 (named + hard-rule constraint, no full mechanics)",
  },
  {
    slug: "qualified-ltc",
    name: "Qualified LTC Funding",
    tier: "core",
    status: "pending_content",
    avatarTags: ["qualified_fund_heavy"],
    notes:
      "Directly implicated by hard rule #8 (a spouse's IRA cannot fund joint LTC benefits — prohibited transaction), so that constraint applies once this strategy is documented. docs/05-product-universe-life-vs-annuity.md notes it's \"often a §1035 annuity-to-LTC hybrid\" but gives no further mechanics.",
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md, CLAUDE.md hard rule #8 (named + hard-rule constraint, no full mechanics)",
  },

  // ---- Supporting (documented) ----
  {
    slug: "ilit-foundation-wrapper",
    name: "Irrevocable Life Insurance Trust (ILIT) — Foundation Wrapper",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Any client whose estate (current or projected) will exceed the federal exemption, or who wants death-benefit proceeds excluded from the taxable estate.",
    legalBasis:
      "IRC §2042 (proceeds includible if insured retains incidents of ownership) — ILIT avoids this by removing ownership. §2035(a) 3-year rule on transferred-in policies. §2503(b) annual exclusion / Crummey notice requirement (Crummey v. Comm'r, 9th Cir. 1968). Trust must be irrevocable and grantor must retain no incidents of ownership.",
    mechanics:
      "Irrevocable trust owns and is beneficiary of the policy. Grantor gifts cash to trust (often via Crummey withdrawal rights to qualify as present-interest gifts under the annual exclusion); trustee pays premiums. If grantor transfers an existing policy in, the 3-year lookback applies.",
    whyUsed:
      "Single most common chassis for keeping life insurance entirely outside the estate. Pairs with virtually every other strategy in the library.",
    matchingParameters: [
      "estate_value > exemption_threshold",
      "wants_db_outside_estate = true",
      "existing_policy_transfer (flag 3yr rule)",
    ],
    uplineQuestions: [
      "Is the trust drafted with Crummey withdrawal rights, and is the gifting/notice process documented annually?",
      "If funding with an existing policy, can we structure a new-issue policy instead to avoid the 3-year lookback?",
      "Who is serving as trustee, and is it an independent trustee (avoids grantor-as-trustee incidents-of-ownership risk)?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "slat",
    name: "Spousal Lifetime Access Trust (SLAT)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Married high-net-worth client who wants to use lifetime exemption now (use-it-or-lose-it concern) but isn't ready to fully give up indirect access to the funds.",
    legalBasis:
      "Uses §2010(c) lifetime exemption ($15M/individual, $30M/couple in 2026 per OBBBA). Grantor trust rules §671-678. Reciprocal trust doctrine risk if spouses create mirror-image SLATs — must differentiate terms. Divorce/death of beneficiary spouse terminates access (\"SLAT risk\").",
    mechanics:
      "Grantor spouse creates irrevocable trust for benefit of the other spouse (and often descendants); gifts cash or assets using lifetime exemption; trust can own life insurance on grantor spouse's life. Grantor trust status typically retained so grantor pays income tax (additional tax-free gift to trust).",
    whyUsed:
      "Premier 2026 strategy: OBBBA made the $15M/$30M exemption permanent, eliminating the prior urgency, but still the leading vehicle to lock in today's exemption against future legislative reduction while funding large survivorship or single-life policies gift-tax-free.",
    matchingParameters: [
      "married = true",
      "estate_value > 15M_single_or_30M_joint",
      "wants_indirect_access = true",
      "uses_lifetime_exemption = true",
    ],
    uplineQuestions: [
      "How are we differentiating the two spouses' trusts to avoid the reciprocal trust doctrine being collapsed by the IRS?",
      "What happens to access and policy funding if the beneficiary spouse predeceases or divorce occurs — is there a backup funding plan?",
      "Is the trust intentionally a grantor trust so the grantor's outside income-tax payments aren't treated as additional gifts?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "dynasty-gst-trust",
    name: "Dynasty Trust / GST-Exempt Trust",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Client wants wealth to skip multiple generations (children → grandchildren → great-grandchildren) without re-taxation at each generational transfer.",
    legalBasis:
      "IRC §2601-2663 (GST tax, 40% flat rate on skip transfers). GST exemption = $15M/person for 2026, NOT portable between spouses (unlike estate exemption) — must be affirmatively allocated. Rule Against Perpetuities varies by state (relevant to trust duration).",
    mechanics:
      "Irrevocable trust (often combined with ILIT/SLAT structure) funded with gifts; grantor allocates GST exemption on Form 709 to the trust at funding. Trust situs chosen in a state permitting long/perpetual trust duration (e.g., SD, DE, NV) and favorable trust income tax treatment.",
    whyUsed:
      "Multi-generational families with $15M+ per spouse should prioritize GST allocation early — unused GST exemption at death is lost permanently if not allocated to a trust during life.",
    matchingParameters: [
      "wants_multigenerational = true",
      "grandchildren_or_great_grandchildren_beneficiaries = true",
      "gst_exemption_remaining > 0",
    ],
    uplineQuestions: [
      "Has GST exemption been formally allocated on a timely filed Form 709, and is allocation tracked separately from the estate exemption?",
      "What trust situs/state is being used, and does it support the desired trust duration and state income tax treatment?",
      "How is the life insurance death benefit structured to maximize GST leverage relative to gift dollars used?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "private-split-dollar-loan-regime",
    name: "Private Split-Dollar (Loan Regime)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Wealthy client wants a family member or ILIT to own a large policy but wants premium dollars treated as a loan (recoverable) rather than a completed gift.",
    legalBasis:
      "Treas. Reg. §1.7872-15 (split-dollar loan regime). Loan regime selected (vs. economic benefit regime) when the non-owner (ILIT) is treated as the borrower. AFR under §1274(d) sets minimum interest to avoid imputed gift treatment. Estate includes the loan receivable (not the death benefit) under §2033 if grantor dies before repayment.",
    mechanics:
      "Grantor (or grantor trust) loans premium dollars to the ILIT under a split-dollar loan agreement; ILIT owns the policy; loan accrues interest at the AFR; collateral assignment secures repayment to the grantor's estate at death or surrender.",
    whyUsed:
      "Converts what would otherwise be a taxable gift (premium payment) into a loan, dramatically reducing gift-tax/exemption usage for very large policies.",
    matchingParameters: [
      "wants_to_minimize_gift_tax_usage = true",
      "large_premium_outlay = true",
      "existing_irrevocable_trust = true",
    ],
    uplineQuestions: [
      "Is this structured as a loan regime or economic benefit regime split-dollar arrangement, and why?",
      "What AFR is being used, and is the loan documented with a promissory note and collateral assignment?",
      "How does the loan receivable get valued and settled in the grantor's estate?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "installment-sale-idgt",
    name: "Installment Sale to Intentionally Defective Grantor Trust (IDGT)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth", "business_owner"],
    clientTriggerProfile:
      "Business owner or investor with appreciating assets who wants to transfer future growth out of the estate while still being able to seed an ILIT/dynasty trust for life insurance funding.",
    legalBasis:
      "Grantor trust rules §671-679 (intentionally triggering grantor status, e.g., via a swap power under §675(4)). Rev. Rul. 85-13 (sale to grantor trust is disregarded for income tax). §453 installment sale rules for the note. No gain/loss recognized between grantor and grantor trust.",
    mechanics:
      "Grantor seeds trust with gift (typically 10% of intended sale price), then sells appreciating asset to the trust for a promissory note at the AFR. Because the trust is a \"defective\" grantor trust for income tax purposes, the sale is not a taxable event and grantor continues paying income tax on trust income (a further tax-free gift to the trust).",
    whyUsed:
      "Premier estate-freeze technique for business owners; the trust's resulting cash flow/asset base can directly fund large life insurance premiums without further gifting.",
    matchingParameters: [
      "owns_appreciating_business_or_asset = true",
      "wants_estate_freeze = true",
      "has_existing_grantor_trust = true",
    ],
    uplineQuestions: [
      "What seed-gift percentage and note terms (AFR, term, balloon vs. amortizing) are being used to withstand IRS scrutiny on the note-to-equity ratio?",
      "How is the asset being valued for the sale (independent appraisal, discounts applied)?",
      "Is the trust intentionally structured to remain a grantor trust for the life of the strategy, and what swap power is used?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "wealth-replacement-crt",
    name: "Wealth Replacement Trust paired with Charitable Remainder Trust (CRT)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Philanthropically inclined client holding a low-basis, highly appreciated asset (stock, real estate, business interest) who wants income, a charitable deduction, and to preserve an inheritance for heirs.",
    legalBasis:
      "§664 (CRT qualification — CRAT/CRUT), §170 charitable income tax deduction (present value of remainder interest), §2055/§2522 estate/gift charitable deduction for the remainder. Asset sale inside CRT avoids immediate capital gains under §664's tax-exempt trust status (gain is taxed to donor only as distributed, under 4-tier accounting).",
    mechanics:
      "Donor transfers appreciated asset to a CRT; CRT sells asset tax-free (trust is tax-exempt), pays donor an income stream for life/term; donor takes a current partial charitable income-tax deduction; a portion of the income stream funds premiums on a policy owned by an ILIT, replacing for heirs the value ultimately going to charity.",
    whyUsed:
      "Solves the classic conflict between charitable intent and family inheritance — very effective for concentrated low-basis positions (e.g., founder stock, appreciated real estate).",
    matchingParameters: [
      "holds_appreciated_low_basis_asset = true",
      "charitable_intent = true",
      "wants_to_preserve_heir_inheritance = true",
    ],
    uplineQuestions: [
      "CRAT or CRUT, and what payout rate satisfies the §664 10% remainder interest test while maximizing donor income?",
      "What is the actual after-tax income stream available to fund ILIT premiums after the CRT's 4-tier taxation on distributions?",
      "Is the wealth-replacement death benefit sized to fully offset the value passing to charity, or only partially?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "flp-fllc-discounted-gifting",
    name: "Family Limited Partnership / LLC (FLP/FLLC) with Discounted Gifting",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth", "business_owner"],
    clientTriggerProfile:
      "Business owner or real-estate family wanting to transfer significant value at a reduced gift-tax cost while retaining management control during life.",
    legalBasis:
      "§2031/§2512 fair market value standard supports valuation discounts (lack of control, lack of marketability) when properly substantiated by independent appraisal. §2704 anti-abuse rules restrict certain restriction-based discounts — entity must have legitimate non-tax business purpose to withstand IRS challenge (cf. Estate of Strangi, Bongard).",
    mechanics:
      "Family contributes business/real estate assets to an FLP/FLLC; senior generation retains general partner/managing member control; minority limited partner/member interests are gifted or sold to an ILIT/dynasty trust at a discounted valuation (appraisal-supported); entity distributions to the trust fund life insurance premiums.",
    whyUsed:
      "Multiplies the effective amount of exemption transferred — common for real estate and operating business families layering into ILIT/dynasty structures.",
    matchingParameters: [
      "owns_family_business_or_real_estate_portfolio = true",
      "wants_to_retain_control = true",
      "discount_planning_acceptable = true",
    ],
    uplineQuestions: [
      "Is there a documented independent appraisal supporting the discount percentage, and a legitimate non-tax business purpose for the entity?",
      "How are entity distributions timed/sized to reliably fund the ILIT's premium obligations?",
      "What is our audit-defense file (formalities, separate bank accounts, arm's-length operating agreement) in case of IRS challenge?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
  {
    slug: "section-162-executive-bonus-reba",
    name: "Section 162 Executive Bonus / Restricted Executive Bonus Arrangement (REBA)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["business_owner"],
    clientTriggerProfile:
      "Business owner wants to retain or reward a key executive with a benefit funded through the business, without ERISA/qualified-plan nondiscrimination constraints.",
    legalBasis:
      "Bonus is deductible to employer under §162 as reasonable compensation; taxable income to executive under §61 in the year paid/constructively received. Not subject to ERISA because it's a single/select arrangement using direct compensation rather than a deferred comp plan funding mechanism. No §409A issues because there's no deferral element (REBA restricts collateral access, not receipt of income).",
    mechanics:
      "Employer pays a bonus (often grossed-up for tax) used by the executive to pay premiums on a policy the executive personally owns; in REBA, an endorsement or restrictive agreement limits the executive's access to cash value until a vesting condition (tenure, performance) is met.",
    whyUsed:
      "Already an active LFIA program — simplest, least compliance-heavy golden-handcuffs tool for closely held businesses; frequently the entry point before layering in Cash Balance or Corporate Reserve strategies.",
    matchingParameters: [
      "business_owner = true",
      "wants_key_employee_retention = true",
      "avoid_erisa_qualified_plan_complexity = true",
    ],
    uplineQuestions: [
      "Is the bonus grossed up to offset the executive's income tax, and is that documented as reasonable compensation?",
      "What vesting schedule/restrictive covenant is attached under the REBA endorsement?",
      "How does this coordinate with any existing Cash Balance or qualified plan for the same executive?",
    ],
    sourceDoc: "docs/advanced-case-design-framework.md",
  },
];
