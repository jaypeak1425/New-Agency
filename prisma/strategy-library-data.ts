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
//     doc would. Their cards below are AI-researched drafts built from the
//     repo's own sketches (docs/05, CLAUDE.md hard rules) plus primary-source
//     verification (IRC, PPA 2006 §844, SECURE 2.0, OBBBA 2026 exemption).
//     Per the Brain Lock rule (CLAUDE.md) they shipped as `pending_content`
//     behind the admin "Approve & go live" sign-off
//     (docs/09-prelaunch-validation.md Path A). The owner (Jay) approved all
//     7 live on 2026-07-02 ("Go live with all"), so they now seed as
//     `documented`; the seed records that promotion in audit_log and never
//     downgrades a live strategy.
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

  // ---- Core (the 7 researched cards — approved live by owner sign-off
  // 2026-07-02 via docs/09 Path A) ----
  {
    slug: "estate-funding",
    name: "Estate Funding (Single-Life ILIT Liquidity)",
    tier: "core",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Single, widowed, or divorced client with an illiquid taxable estate — or a married client whose liquidity need lands at the FIRST death (non-citizen spouse without a QDOT, state estate tax with a low threshold, or business/buy-out obligations due at death) — needing cash at death without forced asset sales.",
    legalBasis:
      "§101(a) death benefit received non-taxable by the trust. Standard ILIT framework: §2042 (no incidents of ownership), §2035 3-year lookback avoided via new-issue with ILIT as original owner, §2503(b) annual-exclusion Crummey gifts. §2056(d): the unlimited marital deduction is NOT available for a non-citizen surviving spouse absent a §2056A QDOT — tax can be due at first death. Compare §6166 installment deferral for closely held business estates: insurance avoids the interest cost, IRS lien, and acceleration risk that come with §6166.",
    mechanics:
      "ILIT applies for and owns a single-life policy on the client from inception; annual-exclusion Crummey gifts (or exemption gifts) fund premiums; at death the trustee provides estate liquidity by lending proceeds to, or purchasing assets from, the estate — cash reaches the tax bill while proceeds stay outside the taxable estate.",
    whyUsed:
      "Survivorship coverage pays at the SECOND death — when the estate tax bill actually lands at the first (single client, non-citizen spouse, state estate tax, business obligations), single-life coverage is the only design that matches the due date of the liability.",
    matchingParameters: [
      "estate_exceeds_exemption = true",
      "illiquid_estate_assets = true",
      "liquidity_needed_at_first_death (single/widowed/divorced, non-citizen spouse, or state estate tax)",
      "insured_individually_underwritable",
    ],
    uplineQuestions: [
      "Is the liquidity need modeled at first death (state estate tax, non-citizen spouse, business obligations) rather than second death — and does that justify single-life over survivorship pricing?",
      "Is the policy new-issue with the ILIT as original applicant/owner, and is the Crummey gifting/notice process documented?",
      "Has a §6166 installment-deferral comparison been run for the closely held business portion, including the interest cost and lien?",
    ],
    sourceDoc:
      "docs/00-developer-brief.md, docs/21-final-handoff.md (named); mechanics/legal basis AI-researched (IRC §101(a)/§2042/§2035/§2056(d)/§2056A/§6166) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02. Differentiated from survivorship-second-to-die as the SINGLE-LIFE / first-death liquidity design (docs/03 and docs/15 use \"Estate Funding (Survivorship)\" as one label, docs/21 lists them separately) — Jay/Luke should confirm this split at sign-off, or merge the two records.",
  },
  {
    slug: "grats",
    name: "GRATs (Grantor Retained Annuity Trusts)",
    tier: "core",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Client above the federal exemption holding assets expected to appreciate faster than the §7520 rate (pre-liquidity-event business interests, concentrated growth stock, real estate ahead of a re-zoning/sale) who wants to move the growth out of the estate without spending exemption or making a large taxable gift.",
    legalBasis:
      "§2702 and Treas. Reg. §25.2702-3 (qualified annuity interest); Walton v. Commissioner, 115 T.C. 589 (2000) permits the \"zeroed-out\" GRAT where the retained annuity's present value at the §7520 rate nearly equals the contribution, making the taxable gift near zero. §2036(a) pulls trust assets back into the estate if the grantor dies during the term (mortality risk). §2642(f) ETIP rule: GST exemption cannot be allocated until the term ends — GRATs are poor GST vehicles.",
    mechanics:
      "Grantor transfers the appreciating asset to a short-term (often 2–3 year) GRAT and retains an annuity that returns the principal plus the §7520 hurdle rate; appreciation above the hurdle passes to the remainder beneficiaries (often a grantor trust for the family) with little or no taxable gift. Rolling GRATs (re-contributing each annuity payment to a new GRAT) smooth market and mortality risk. Life insurance owned by an ILIT hedges the §2036 death-during-term risk — if the grantor dies mid-term the GRAT fails back into the estate and the death benefit covers the resulting tax.",
    whyUsed:
      "The premier near-zero-gift estate freeze for volatile or high-growth assets when the client won't part with exemption — and every GRAT creates an insurance need (the mortality hedge), which is why it belongs in a life producer's core library.",
    matchingParameters: [
      "estate_exceeds_exemption = true",
      "owns_appreciating_business_or_concentrated_asset = true",
      "expected_growth > 7520_hurdle_rate",
      "wants_to_minimize_gift_tax_usage = true",
    ],
    uplineQuestions: [
      "What GRAT term and §7520 rate is the attorney modeling, and is the structure zeroed-out per Walton or deliberately leaving a small taxable gift?",
      "Is an ILIT-owned policy in place hedging the §2036 death-during-term risk, and is the face amount sized to the projected estate tax if the GRAT fails?",
      "Is the remainder passing to a grantor trust (so post-GRAT growth also compounds estate-tax-free), and has GST allocation been kept off this vehicle given the ETIP rule?",
    ],
    sourceDoc:
      "docs/00-developer-brief.md, docs/21-final-handoff.md (named); mechanics/legal basis AI-researched (IRC §2702/§2036/§2642(f), Walton v. Comm'r, Treas. Reg. §25.2702-3) — owner sign-off 2026-07-02",
    notes: "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 Path A).",
  },
  {
    slug: "quiet-wealth-transfer",
    name: "Quiet Wealth Transfer (QWT)",
    tier: "core",
    status: "documented",
    avatarTags: ["qualified_fund_heavy"],
    clientTriggerProfile:
      "Client with $500K+ of qualified money (IRA/401(k)) they don't need to live on, whose real goal is legacy — especially post-SECURE Act, where heirs must drain an inherited IRA within 10 years at their own (often peak-earnings) tax rates.",
    legalBasis:
      "This is a DISTRIBUTION strategy, never an exchange: §1035 does not apply to qualified money (hard rule #2) and no direct annuity-to-life §1035 exists (hard rule #1). The qualified funds purchase an IRA-owned SPIA — annuitization satisfies §401(a)(9) RMDs under Treas. Reg. §1.401(a)(9)-6 — and payments are taxable income under §72. After-tax income makes §2503(b) Crummey gifts to an ILIT that is the ORIGINAL owner of the life policy (hard rule #4, avoiding the §2035 lookback). Death benefit is non-taxable under §101(a) and outside the estate. Motivation: §401(a)(9)(H) (SECURE Act 10-year rule) makes the IRA one of the worst assets to die holding.",
    mechanics:
      "The docs/05 SPIA bridge: annuitize the qualified balance into a SPIA (lifetime taxable income, RMDs satisfied automatically); the client pays income tax on the payments at their own — typically lower — bracket instead of the heirs' brackets; the after-tax income funds premiums, via Crummey gifts, on an ILIT-owned permanent policy. The taxable, 10-year-forced IRA is quietly converted into a non-taxable death benefit outside the estate, while the policy remains in force.",
    whyUsed:
      "Post-SECURE, an inherited IRA is a compressed tax bomb for the children; QWT swaps it for a leveraged, non-taxable, estate-excluded legacy — the flagship Qualified-Fund-Heavy play and the canonical SPIA-bridge design the 9 hard rules were written around.",
    matchingParameters: [
      "qualified_funds >= 500k",
      "legacy_or_estate_planning_goal = true",
      "income_not_needed_for_lifestyle (funds are legacy money)",
      "insured_underwritable (life policy on client or spouse)",
      "ilit_original_owner = true (hard rule 4)",
    ],
    uplineQuestions: [
      "Is the SPIA quoted inside the IRA (qualified SPIA) so annuitization satisfies §401(a)(9), and what payout option (life-only vs. period-certain) balances income against legacy?",
      "What is the after-tax income at the client's bracket, and does it comfortably carry the ILIT premium with Crummey notices documented annually?",
      "Is the life policy new-issue with the ILIT as original applicant/owner — never a transfer or an attempted annuity-to-life exchange?",
    ],
    sourceDoc:
      "docs/05-product-universe-life-vs-annuity.md (SPIA-bridge sketch), CLAUDE.md hard rules 1/2/4; expanded legal basis AI-researched (§72, §401(a)(9), SECURE §401(a)(9)(H), §101(a)) — owner sign-off 2026-07-02",
    notes: "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 Path A).",
  },
  {
    slug: "rmd-repositioning",
    name: "RMD Repositioning",
    tier: "core",
    status: "documented",
    avatarTags: ["qualified_fund_heavy"],
    clientTriggerProfile:
      "Client at RMD age (73 under SECURE 2.0; 75 for those born 1960 or later, starting 2033) with $500K+ qualified, who is forced to take distributions they don't spend — the RMDs land in a taxable account and eventually back in the taxable estate.",
    legalBasis:
      "§401(a)(9) forces the distributions; SECURE 2.0 (2022) set the required beginning age at 73, rising to 75 in 2033. The strategy adds no new tax event — it redirects money already being distributed and taxed. After-tax RMDs make §2503(b) Crummey gifts to an ILIT holding a new-issue policy (hard rule #4); §101(a) death benefit is non-taxable and estate-excluded. SECURE's 10-year rule (§401(a)(9)(H)) supplies the urgency: whatever qualified balance remains at death is drained into the heirs' brackets within a decade.",
    mechanics:
      "No annuitization required — the tax is already being paid on the forced RMD, so the only question is where the after-tax dollars land. Instead of a taxable brokerage account, the RMD funds ILIT premiums via annual-exclusion gifts; each year's forced distribution converts into leveraged, non-taxable death benefit outside the estate while the policy remains in force.",
    whyUsed:
      "The easiest yes in the Qualified-Fund-Heavy universe: the client is already taking the money and already paying the tax — Atlas just repositions the destination. Simpler than QWT (no SPIA needed) whenever the RMD alone carries the premium.",
    matchingParameters: [
      "qualified_funds >= 500k",
      "age >= 73 (RMDs already forced)",
      "rmds_not_needed_for_lifestyle = true",
      "legacy_or_estate_planning_goal = true",
      "insured_underwritable",
    ],
    uplineQuestions: [
      "Does the annual RMD, after tax, fully carry the target premium — or should the design blend RMD dollars with other income (or step down the face amount)?",
      "Is the policy new-issue with the ILIT as original applicant/owner, with Crummey notices documented?",
      "Given the client's age, what product chassis (GUL vs. current-assumption UL vs. whole life) best matches a premium stream that ends at death?",
    ],
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md (named); mechanics/legal basis AI-researched (§401(a)(9), SECURE 2.0 ages 73/75, §2503(b), §101(a)) — owner sign-off 2026-07-02",
    notes: "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 Path A).",
  },
  {
    slug: "roth-plus-life",
    name: "Roth+Life",
    tier: "core",
    status: "documented",
    avatarTags: ["qualified_fund_heavy"],
    clientTriggerProfile:
      "Client with $500K+ qualified money in a lower-bracket window (typically post-retirement, pre-RMD) willing to pre-pay income tax to convert to Roth — paired with life insurance so the conversion-tax outlay doesn't shrink the legacy.",
    legalBasis:
      "§408A conversion rules: any traditional IRA balance can convert to Roth with the converted amount taxed as ordinary income in the conversion year; since TCJA repealed §408A(d)(6) recharacterization for conversions (2018+), a conversion is IRREVOCABLE — staging matters. Roth IRAs have no lifetime RMDs (§408A(c)(5)); heirs under the 10-year rule drain the Roth non-taxable. Life leg: §101(a) death benefit; watch §7702A — overfunding the policy into MEC status is irrevocable (hard rule #6).",
    mechanics:
      "Staged partial conversions sized each year to fill the client's low brackets (converting to the top of the current bracket, never blindly all at once — conversions can't be undone). The life policy runs alongside: sized so the death benefit restores the estate for the conversion taxes paid, or owned by an ILIT to add estate exclusion for larger estates. The result heirs receive: a Roth that is non-taxable to them under the 10-year rule, plus a non-taxable death benefit, instead of a traditional IRA taxed at their peak brackets.",
    whyUsed:
      "Converts the client's future RMD problem and the heirs' 10-year tax bomb into two non-taxable buckets — the analytical companion to QWT for clients who want to keep the account rather than annuitize it.",
    matchingParameters: [
      "qualified_funds >= 500k",
      "current_bracket_window_low (pre-RMD or low-income years)",
      "legacy_or_estate_planning_goal = true",
      "can_pay_conversion_tax_from_outside_funds (preferred)",
      "insured_underwritable",
    ],
    uplineQuestions: [
      "What multi-year conversion schedule keeps each year inside the target bracket, and is the conversion tax being paid from outside funds so the full balance converts?",
      "Is the life policy sized to restore the conversion-tax outlay to the estate, and should an ILIT own it given the estate size?",
      "Is the funding pattern MEC-tested (§7702A 7-pay) — remembering MEC status is irrevocable once triggered?",
    ],
    sourceDoc:
      "docs/00-developer-brief.md, docs/05-product-universe-life-vs-annuity.md (named); mechanics/legal basis AI-researched (§408A, TCJA recharacterization repeal, §408A(c)(5), §7702A) — owner sign-off 2026-07-02",
    notes: "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 Path A).",
  },
  {
    slug: "annuity-rescue",
    name: "Annuity Rescue",
    tier: "core",
    status: "documented",
    avatarTags: ["qualified_fund_heavy"],
    clientTriggerProfile:
      "Client holding an old deferred annuity that no longer fits — high fees, weak crediting, an unneeded income rider, or a large embedded gain the client never intends to spend (the classic \"annuity they bought in their 60s and forgot\").",
    legalBasis:
      "Three compliant exits, each hard-rule-gated. (1) Non-qualified §1035(a)(3) annuity-to-annuity exchange into a better contract — non-qualified only (hard rule #2); qualified annuities move by rollover/transfer instead. (2) Non-qualified §1035 annuity-to-LTC exchange under PPA 2006 §844 (effective 2010): direct assignment into a §7702B-qualified hybrid, where the embedded gain is consumed by LTC benefits non-taxable under §72(e)(11)/§7702B. (3) Legacy intent: annuitize to a SPIA and fund an ILIT-owned life policy with the after-tax income — NEVER a direct annuity-to-life §1035, which does not exist (hard rule #1).",
    mechanics:
      "Diagnose the old contract first (surrender charge schedule, gain, rider value, carrier strength), then pick the exit that matches the client's actual use for the money: better accumulation → path 1 (full or partial 1035, direct carrier-to-carrier assignment); LTC exposure → path 2 (the gain that would have been ordinary income on surrender instead pays LTC benefits); pure legacy → path 3 (the SPIA bridge into life-in-ILIT). Losses on surrender and gains carried through an exchange keep basis tracking essential.",
    whyUsed:
      "Billions sit in stale deferred annuities with embedded gains — the rescue turns a dormant, tax-deferred liability into the client's actual goal (growth, LTC protection, or legacy) without triggering the gain on surrender, and it's the natural annuity-side answer when the age/health gate closes the life universe.",
    matchingParameters: [
      "existing_deferred_annuity = true (from the annuity intake)",
      "contract_underperforming_or_mismatched = true",
      "source_of_funds = non_qualified (for the §1035 paths; qualified uses rollover rules)",
      "surrender_charges_modeled = true",
    ],
    uplineQuestions: [
      "What is the embedded gain, remaining surrender schedule, and any rider value that would be forfeited — does the new contract clear that hurdle?",
      "Is the exchange structured as a direct carrier-to-carrier §1035 assignment (never a surrender-and-repurchase), and is the money confirmed non-qualified?",
      "If the client's real goal is legacy, has the SPIA-bridge-to-ILIT design been quoted instead — and confirmed as new-issue life with the ILIT as original owner?",
    ],
    sourceDoc:
      "docs/05-product-universe-life-vs-annuity.md, CLAUDE.md hard rules 1/2; expanded legal basis AI-researched (§1035(a)(3), PPA 2006 §844, §72(e)(11), §7702B) — owner sign-off 2026-07-02",
    notes: "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 Path A).",
  },
  {
    slug: "qualified-ltc",
    name: "Qualified LTC Funding",
    tier: "core",
    status: "documented",
    avatarTags: ["qualified_fund_heavy"],
    clientTriggerProfile:
      "Client 60+ worried about long-term-care costs, holding either an old non-qualified annuity with embedded gain (the docs/05 \"§1035 annuity-to-LTC hybrid\" case) or qualified money that can fund a hybrid via distributions — self-insuring today with fully taxable dollars.",
    legalBasis:
      "§7702B defines tax-qualified LTC coverage: benefits received for qualified LTC are non-taxable (per-diem limits apply under §7702B(d)). PPA 2006 §844 (effective 2010) amended §1035 to permit non-qualified annuity/life → LTC-hybrid exchanges via direct assignment, and added §72(e)(11): charges against annuity value for LTC riders are not taxable distributions — embedded gain is consumed by care benefits instead of ever being taxed. Qualified money cannot §1035 (hard rule #2) — it funds a hybrid via taxable distributions or an IRA-funded annuity-with-LTC-rider design. Hard rule #8: a spouse's IRA can never fund JOINT LTC benefits — IRA-funded designs must cover the IRA owner individually; joint/shared benefits come only from non-qualified money.",
    mechanics:
      "Non-qualified path: §1035 the gain-heavy annuity (or life policy) directly into a §7702B hybrid LTC annuity or life/LTC policy — dollars that would have been ordinary income on surrender become non-taxable care benefits. Qualified path: distributions (often a 10-pay schedule, or the RMDs themselves) fund the hybrid, spreading the tax; each spouse's IRA funds their own individual coverage only. Hybrids return value to the family (death benefit or remaining account value) if care is never needed — the answer to \"use it or lose it\" resistance on standalone LTC.",
    whyUsed:
      "LTC is the risk that unwinds every other strategy in the library — a two-year care event can force the exact asset sales the estate plan was built to avoid. Hybrid funding turns a dormant taxable gain (or forced RMDs) into non-taxable care benefits, and underwriting is typically simplified versus fully underwritten life, keeping it available after the life-insurance age/health gate closes.",
    matchingParameters: [
      "age >= 60 or ltc_concern_expressed",
      "existing_annuity_with_gain = true (non-qualified §1035 path) OR qualified_funds >= 500k (distribution path)",
      "no_spouse_ira_funding_joint_benefits (hard rule 8)",
      "hybrid_return-of-value_design_preferred = true",
    ],
    uplineQuestions: [
      "For the non-qualified path: what is the embedded gain being repositioned, and is the exchange a direct assignment into a §7702B-qualified hybrid (full or partial 1035)?",
      "For the qualified path: is each spouse's IRA funding only that spouse's individual benefit — never a joint benefit (hard rule 8) — and is the distribution schedule tax-modeled?",
      "What are the inflation rider, benefit period, and elimination period — and does the hybrid's return-of-value feature answer the client's use-it-or-lose-it objection?",
    ],
    sourceDoc:
      "docs/05-product-universe-life-vs-annuity.md, CLAUDE.md hard rule 8; expanded legal basis AI-researched (§7702B, PPA 2006 §844, §72(e)(11), §7702B(d)) — owner sign-off 2026-07-02",
    notes: "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 Path A).",
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

  // ---- Supporting (library additions, 2026-07-02) ----
  // The CLU/CFP expansion beyond the original 9-core/8-supporting roster:
  // buy-sell and executive-benefit designs for the Business Owner avatar,
  // trust structures + PPLI for HNW, and the Family/Legacy avatar's first
  // strategy. Authored from primary sources (Connelly v. United States, 602
  // U.S. 257 (2024); §101(j); §409A; Treas. Reg. §1.61-22; §2702; §817(h))
  // — new strategies enter the locked library ONLY through the docs/09
  // validation sign-off ("Approve & go live"). The owner approved all 9 live
  // on 2026-07-02 ("Go live"), so they seed as documented; the seed's
  // promote-only status rule records the audit entry on databases that
  // still hold them as pending.
  {
    slug: "buy-sell-life-insurance",
    name: "Buy-Sell Agreement Funding (Cross-Purchase / Entity / Insurance LLC)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["business_owner"],
    clientTriggerProfile:
      "Co-owned business (partnership, S-Corp, C-Corp, LLC with multiple members) with no funded succession plan — at an owner's death the survivors need to buy the interest and the family needs to be bought out, at a price everyone agreed to in advance.",
    legalBasis:
      "§2703(b): a buy-sell fixes estate-tax value only if it's a bona fide business arrangement, not a device to transfer to family below value, and comparable to arm's-length terms. Connelly v. United States, 602 U.S. 257 (2024), unanimous: in an ENTITY-REDEMPTION design the corporate-owned death benefit increases the company's value for estate tax with NO offset for the redemption obligation — the estate can be taxed on insurance bought to buy it out. Cross-purchase (or a special-purpose insurance LLC) avoids that inclusion. §101(j) notice-and-consent applies to any entity-owned policy before issue. §101(a)(2) transfer-for-value trap when existing policies are shuffled between owners — the partner/partnership exceptions are the usual cure.",
    mechanics:
      "Cross-purchase: each owner owns and is beneficiary of a policy on each other owner (n×(n−1) policies); survivors buy the decedent's interest directly and get a cost-basis step-up in the purchased interest. Entity redemption: the company owns one policy per owner and redeems the decedent's interest — administratively simple but post-Connelly carries estate-tax inclusion risk and no survivor basis step-up. Insurance-only LLC: a separate LLC (taxed as a partnership) holds all the policies, consolidating cross-purchase mechanics, dodging transfer-for-value via the partner exception, and keeping proceeds out of the operating company's valuation. Wait-and-see hybrids defer the choice until death.",
    whyUsed:
      "The cornerstone case for every co-owned business — it converts a valuation fight and a forced fire-sale into a funded, pre-priced transaction, and post-Connelly every EXISTING redemption-style agreement in an agent's book is a review opportunity.",
    matchingParameters: [
      "business_owner = true",
      "co_owners_present = true (Q6)",
      "business_continuity_goal = true",
      "owners_insurable (docs/04 gives buy-sell its own age gate: > 75 fails)",
    ],
    uplineQuestions: [
      "Post-Connelly: if the existing agreement is entity-redemption, should it be restructured to cross-purchase or an insurance LLC before the next owner death locks in the inclusion?",
      "Does the valuation formula satisfy §2703(b), and when was the price/valuation last certified against the funding amount?",
      "Are any existing policies being transferred between owners or the entity — and if so, which transfer-for-value exception covers each transfer?",
    ],
    sourceDoc:
      "AI-researched (Connelly v. United States, 602 U.S. 257 (2024); §2703(b); §101(a)(2); §101(j)); named in docs/03's own intake example (\"set up a buy-sell\")",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries). docs/04-field-underwriting.md's section 5 lists a buy-sell-specific age gate (> 75) — stricter than the global 80 ceiling; flagged in matchingParameters until a per-strategy age-gate override exists in the engine.",
  },
  {
    slug: "key-person-life-insurance",
    name: "Key Person Life Insurance",
    tier: "supporting",
    status: "documented",
    avatarTags: ["business_owner"],
    clientTriggerProfile:
      "Business whose revenue, lending relationships, or operations depend heavily on one or a few people (rainmaker, founder, technical lead) — the death of that person would cost the company money it can't replace from cash flow.",
    legalBasis:
      "§101(j) (PPA 2006) governs all employer-owned life insurance: death proceeds above premiums paid are TAXABLE to the employer unless (a) written notice and consent are obtained from the insured BEFORE issue and (b) the insured falls in an exception class (director or highly compensated — top 35% — or employee within 12 months of death). Form 8925 annual reporting required. Premiums are non-deductible under §264(a)(1); proceeds, when §101(j) is satisfied, are received non-taxable.",
    mechanics:
      "The business applies for, owns, pays for, and is beneficiary of a policy on the key person. Face amount sized by a multiple-of-compensation method (commonly 5–10×) or a contribution-to-earnings method (the person's share of profits × years to replace them). Permanent designs add a balance-sheet asset (cash value) and can later be repurposed into an executive benefit for the same person.",
    whyUsed:
      "The simplest business sale in the library and frequently the first policy a business ever buys — it also opens every retention conversation (§162, REBA, split-dollar, NQDC) about the same key people.",
    matchingParameters: [
      "business_owner = true",
      "key_employees_count > 0 (Q7)",
      "revenue_dependency_on_key_person = true",
      "101j_notice_and_consent_before_issue (hard rule 5)",
    ],
    uplineQuestions: [
      "Is the §101(j) notice-and-consent paperwork in the carrier's application package, and is it signed BEFORE issue — and who is tracking the Form 8925 filing annually?",
      "What sizing method (multiple of compensation vs. contribution to earnings) supports the face amount if the IRS or a lender asks?",
      "Term or permanent — and if permanent, is the cash value earmarked to convert into a retention benefit for this same key person later?",
    ],
    sourceDoc: "AI-researched (§101(j), §264(a)(1), PPA 2006) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries).",
  },
  {
    slug: "coli-corporate-reserve",
    name: "COLI Corporate Reserve",
    tier: "supporting",
    status: "documented",
    avatarTags: ["business_owner"],
    clientTriggerProfile:
      "Profitable business (any entity except a sole prop) accumulating retained earnings in taxable instruments, looking for a tax-advantaged place to warehouse reserve capital that stays on the balance sheet and can informally back benefit promises.",
    legalBasis:
      "Corporate-owned permanent life insurance: inside buildup is non-taxable while the policy remains in force (§7702-compliant design), and the death benefit is received non-taxable when §101(j) notice-and-consent is satisfied before issue (hard rule 5). §264(f) pro-rata interest-expense disallowance can bite leveraged businesses holding unborrowed cash value — model it. §7702A 7-pay testing: overfunding into MEC status is irrevocable (hard rule 6). C-Corp AMT/E&P and S-Corp AAA/basis effects differ — coordinate with the CPA.",
    mechanics:
      "The company owns high-cash-value permanent policies (often on owners or key people, with §101(j) consent), funding them from retained earnings at or near — but below — the MEC limit. Cash value grows non-taxable while in force, is accessible via withdrawals-to-basis and policy loans, sits on the balance sheet as an asset, and the death benefit provides cost recovery. The reserve informally backs whatever the business needs later: key-person exposure, buy-sell funding, NQDC promises, or an owner's exit.",
    whyUsed:
      "docs/03's own intake example asks for exactly this (\"put money aside in a company reserve\") — it's the business owner's version of the personal cash-value conversation, with the docs/07 COLI commission basis (0.5% of face) already wired into the app's math.",
    matchingParameters: [
      "business_owner = true",
      "entity_structure != sole_prop",
      "retained_earnings_to_reposition = true",
      "mec_limit_respected (hard rule 6)",
    ],
    uplineQuestions: [
      "What funding schedule keeps the design below the §7702A 7-pay MEC line while maximizing early cash value — and is the client clear that a MEC is irrevocable?",
      "Does §264(f) interest disallowance apply given the company's debt, and has the CPA modeled the E&P (C-Corp) or AAA/basis (S-Corp) treatment?",
      "Is §101(j) notice-and-consent complete for every insured before issue, with Form 8925 reporting assigned to someone specific?",
    ],
    sourceDoc:
      "AI-researched (§7702/§7702A, §101(j), §264(f)) + docs/07-progress-dashboard-math.md's COLI commission basis — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries).",
  },
  {
    slug: "nqdc-serp-coli",
    name: "Nonqualified Deferred Compensation (SERP) Informally Funded with COLI",
    tier: "supporting",
    status: "documented",
    avatarTags: ["business_owner"],
    clientTriggerProfile:
      "Business owner who wants to promise a select executive (or themselves, in a C-Corp) meaningful retirement income above qualified-plan limits, with golden-handcuffs vesting — without the nondiscrimination testing of a qualified plan.",
    legalBasis:
      "NQDC is an UNFUNDED contractual promise: no ERISA funding rules because it's a top-hat plan for a select group, but §409A rigidly controls deferral elections, distribution triggers, and acceleration (violations = immediate income + 20% penalty to the executive). The employer deducts benefits only when the executive includes them (§404(a)(5)). COLI informally funding the promise must clear §101(j) notice-and-consent (hard rule 5). A rabbi trust (Rev. Proc. 92-64) can secure the promise against a change of heart — but not against the employer's creditors, or the executive is taxed currently.",
    mechanics:
      "The company adopts a SERP/deferral agreement (fixed benefit or account balance, vesting tied to tenure) drafted to §409A's distribution rules. It then buys COLI on the executive sized so cash value and death benefit track the benefit liability: cash value grows non-taxable while the policy remains in force, benefit payments are made from corporate funds (deductible when paid), and the death benefit provides full cost recovery. A rabbi trust holds the policies when the executive wants protection from new ownership.",
    whyUsed:
      "The heavyweight retention tool when a §162 bonus isn't enough handcuff — the benefit is forfeitable until vesting, the company keeps the asset on its books, and it recovers every dollar at death; the natural upgrade path from the Key Person and Corporate Reserve conversations.",
    matchingParameters: [
      "business_owner = true",
      "key_employees_count > 0",
      "funding_preference = employer_funded",
      "benefit_above_qualified_plan_limits = true",
    ],
    uplineQuestions: [
      "Is the plan document §409A-clean (permissible distribution events only, no employer discretion to accelerate), and who reviewed it — this is drafting, not product?",
      "Is the COLI sized to the benefit liability with cost recovery at death, and is §101(j) consent signed before issue?",
      "Does the executive want a rabbi trust — and do they understand it protects against a change of control, not against corporate creditors?",
    ],
    sourceDoc:
      "AI-researched (§409A, §404(a)(5), §101(j), Rev. Proc. 92-64) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries).",
  },
  {
    slug: "endorsement-split-dollar",
    name: "Endorsement Split-Dollar (Economic Benefit Regime)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["business_owner"],
    clientTriggerProfile:
      "Business owner who wants to give a key executive substantial personal death benefit protection cheaply, while the company keeps ownership of the policy, its cash value, and full cost recovery — the control-retaining alternative to a §162 bonus.",
    legalBasis:
      "Treas. Reg. §1.61-22 (economic benefit regime): when the EMPLOYER owns the policy and endorses death benefit to the executive's beneficiary, the executive is taxed each year only on the economic benefit — the annual term cost of the endorsed coverage (Table 2001 rates or the carrier's lower published alternative term rates). No §7872 loan treatment (that's the loan regime, used in the private split-dollar card). Rollout (transferring the policy to the executive later) is a taxable event measured by policy value less what the executive pays.",
    mechanics:
      "The company owns and pays for a permanent policy on the executive and files an endorsement giving the executive's beneficiary a stated slice of the death benefit; the company keeps the rest (cost recovery) plus all cash value. The executive reports only the small annual term cost as income (or pays it to the company, eliminating the income). At retirement or vesting the arrangement either terminates (company keeps everything), or rolls the policy out to the executive as the final reward.",
    whyUsed:
      "Delivers 'the company buys you millions of personal coverage' at a taxable cost to the executive of a few hundred dollars a year — with handcuffs the §162/REBA design can't match, because the employer owns the policy until it decides otherwise.",
    matchingParameters: [
      "business_owner = true",
      "key_employees_count > 0",
      "funding_preference = employer_funded",
      "employer_wants_control_and_cost_recovery = true",
    ],
    uplineQuestions: [
      "Is the split-dollar agreement documented as economic-benefit regime with the endorsement filed at the carrier — and are Table 2001 (or alternative term) costs being reported on the executive's W-2 annually?",
      "What is the planned exit — terminate with employer cost recovery, or roll out to the executive — and what's the projected taxable value at rollout?",
      "How does this coordinate with the §162/REBA program for the same executive tier (endorsement for control, bonus for simplicity)?",
    ],
    sourceDoc:
      "AI-researched (Treas. Reg. §1.61-22, Notice 2002-8/Table 2001) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries). Complements — doesn't replace — private-split-dollar-loan-regime (family/ILIT context) and section-162-executive-bonus-reba (executive-owned context).",
  },
  {
    slug: "qprt-insurance-hedge",
    name: "Qualified Personal Residence Trust (QPRT) with Life Insurance Hedge",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Client above the exemption with a valuable primary residence or vacation home they intend to keep in the family — the house is a large, appreciating, emotionally-held estate asset that's otherwise hard to gift.",
    legalBasis:
      "§2702(a)(3)(A)(ii): the personal-residence exception to the zero-value rule — the grantor's retained term of use is valued under §7520, so only the discounted remainder is a taxable gift. §2036(a) pulls the residence back into the estate if the grantor dies during the retained term — the classic QPRT mortality risk. Trade-off: the residence passes with carryover basis (no §1014 step-up), so QPRTs favor estates where the 40% estate tax dwarfs the heirs' capital-gains exposure. Post-term, the grantor must pay fair-market rent to remain — which is itself a further tax-free wealth transfer to the trust.",
    mechanics:
      "Grantor deeds the residence to a QPRT retaining the right to live in it for a fixed term (commonly 10–15 years); the taxable gift is only the actuarial remainder — a fraction of the home's value. If the grantor survives the term, the residence (plus all appreciation) is out of the estate and the grantor rents it back at market rates. An ILIT-owned policy hedges the §2036 risk: if the grantor dies mid-term the QPRT fails back into the estate, and the death benefit covers the estate tax the trust was built to avoid.",
    whyUsed:
      "One of the few §2702-sanctioned discounts left for the asset every HNW client owns and won't sell — and, like the GRAT, every QPRT manufactures a term-insurance need (the mortality hedge), which is why it belongs in a producer's library.",
    matchingParameters: [
      "estate_exceeds_exemption = true",
      "illiquid_estate_assets = true (residence-heavy)",
      "grantor_health_supports_surviving_term = true",
      "heirs_intend_to_keep_residence = true",
    ],
    uplineQuestions: [
      "What term length balances the remainder discount against realistic survival odds — and is an ILIT policy in place hedging the §2036 death-during-term failure?",
      "Have the heirs weighed the lost §1014 basis step-up against the estate-tax saving for this residence's appreciation profile?",
      "Is the post-term market-rent lease documented and actually paid (it's both the §2036 protection and a bonus wealth transfer)?",
    ],
    sourceDoc: "AI-researched (§2702(a)(3), §2036(a), §7520, §1014) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries).",
  },
  {
    slug: "ppli",
    name: "Private Placement Life Insurance (PPLI)",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Ultra-HNW client ($5M+ liquid, accredited investor / qualified purchaser) holding tax-inefficient alternatives — hedge funds, credit strategies, high-turnover portfolios — generating ordinary income taxed at top rates every year.",
    legalBasis:
      "A §7702-compliant variable universal life policy issued via private placement: inside buildup is non-taxable while the policy remains in force, and the death benefit passes under §101(a). §817(h) diversification rules bind the insurance-dedicated funds (no look-through to a non-diversified portfolio). The investor-control doctrine (Rev. Rul. 2003-91; Webber v. Commissioner, 144 T.C. 324 (2015)) is the live wire: the policyholder may allocate among insurance-dedicated funds but must NOT direct underlying investments, or the IRS taxes the client as the direct owner. Typically owned by a dynasty trust/ILIT so the wrapper is also estate- and GST-excluded.",
    mechanics:
      "The client (usually through an ILIT/dynasty trust) funds an institutionally-priced PPLI policy — low loads, no surrender charges — allocated among insurance-dedicated funds that mirror the alternatives the client already wanted. Annual tax drag on the strategies disappears while the policy remains in force; access comes via withdrawals-to-basis and loans; at death the entire account passes as non-taxable death benefit outside the estate. MEC testing (hard rule 6) governs the funding schedule.",
    whyUsed:
      "For the right client it's the single largest tax lever in the library — converting perpetual top-bracket ordinary income into a non-taxable, estate-excluded death benefit — and it positions the producer at the family-office table.",
    matchingParameters: [
      "net_worth > 5M (liquid, accredited/qualified purchaser)",
      "tax_inefficient_alternatives_held = true",
      "legacy_or_estate_planning_goal = true",
      "no_investor_control (allocation only, never direction)",
    ],
    uplineQuestions: [
      "Which carrier's insurance-dedicated fund platform covers the client's target strategies, and does every fund certify §817(h) diversification?",
      "Is the ownership structure (ILIT/dynasty trust) and funding schedule MEC-tested — and is the client counseled, in writing, on the investor-control line (allocate, never direct)?",
      "What are the all-in policy costs versus the portfolio's current annual tax drag — the case stands or falls on that spread?",
    ],
    sourceDoc:
      "AI-researched (§7702, §817(h), Rev. Rul. 2003-91, Webber v. Comm'r, 144 T.C. 324 (2015)) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries).",
  },
  {
    slug: "clat-wealth-replacement",
    name: "Charitable Lead Annuity Trust (CLAT) with Wealth Replacement",
    tier: "supporting",
    status: "documented",
    avatarTags: ["high_net_worth"],
    clientTriggerProfile:
      "Charitably-inclined client above the exemption — often in a spike-income year (business sale, large bonus, Roth conversion) — who wants a large current deduction and to pass the remainder to heirs at a deeply discounted gift value.",
    legalBasis:
      "The mirror image of the CRT already in the library: charity gets the LEAD annuity stream, heirs get the remainder. Grantor CLAT: §170(f)(2)(B) gives an immediate income-tax deduction for the present value of the charity's stream (front-loaded into the high-income year), with the grantor then taxed on trust income (phantom income). Non-grantor CLAT: no upfront deduction, but the trust deducts its charitable payments (§642(c)). Either way §2522/§2055 removes the lead interest from gift/estate tax, and a zeroed-out (Walton-style) CLAT passes the remainder to heirs at a near-zero taxable gift. Low §7520 months favor CLATs — the opposite of CRTs.",
    mechanics:
      "Client funds the CLAT in the spike year; the trust pays a fixed annuity to charity (often the family's own foundation or donor-advised fund) for the term; whatever growth beats the §7520 hurdle passes to the heirs (or a trust for them) gift-tax-free. An ILIT-owned policy replaces the wealth committed to charity — or hedges a mid-term death / underperforming trust — so the family's inheritance doesn't depend on the market beating the hurdle.",
    whyUsed:
      "Completes the charitable pair with the CRT card: CRT for low-basis assets needing income, CLAT for high-income years needing deductions — both manufacture an ILIT wealth-replacement sale, and both keep the client's philanthropy and the family's inheritance from competing.",
    matchingParameters: [
      "estate_exceeds_exemption = true",
      "charitable_intent = true",
      "spike_income_year_or_deduction_need = true",
      "wants_to_preserve_heir_inheritance = true",
    ],
    uplineQuestions: [
      "Grantor or non-grantor CLAT — does the client need the §170(f)(2)(B) deduction this year badly enough to absorb the phantom income that follows?",
      "Is the annuity zeroed-out against this month's §7520 rate, and what remainder do the projections show at conservative growth?",
      "Is the wealth-replacement ILIT sized to the charity-bound value or to the full inheritance target — and does the client's cash flow carry both the CLAT gift and the premiums?",
    ],
    sourceDoc:
      "AI-researched (§170(f)(2)(B), §642(c), §2522/§2055, §7520) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries).",
  },
  {
    slug: "family-income-legacy",
    name: "Family Income Replacement & Legacy Blend",
    tier: "supporting",
    status: "documented",
    avatarTags: ["family_legacy"],
    clientTriggerProfile:
      "Client with dependents under 18 (or clear family-legacy intent) and household net worth below the HNW tier — the estate problem isn't taxes, it's that the family's plans die with the breadwinner's income.",
    legalBasis:
      "§101(a): death benefit received by the family non-taxable. Needs-based sizing via DIME (Debt, Income replacement, Mortgage, Education) or human-life-value (income × working years, discounted). Term conversion privileges preserve insurability without new underwriting — contractual, carrier-specific. Beneficiary design (per stirpes, UTMA/trust for minors, contingent beneficiaries) does the estate-planning work at this tier; probate avoidance comes free with a named beneficiary.",
    mechanics:
      "Layered term ladder matched to the actual liabilities (20-year for the youngest child's dependency, 15-year for the mortgage balance, etc.) so coverage and premium step down as needs expire — plus a small permanent base policy for final expenses and a guaranteed legacy, structured to stay MEC-clean if cash value matters. Convertibility on every term layer keeps the door open to the permanent designs upstream in this library as the client's wealth grows.",
    whyUsed:
      "The Family/Legacy avatar's entry strategy and the app's door-opener case: the docs/07 model books $2.5K average Y1 commission per Family/Legacy client, and today's term ladder is routinely tomorrow's business owner or estate case — the conversion privilege IS the pipeline.",
    matchingParameters: [
      "has_dependents_under_18 = true OR legacy_goal = true",
      "net_worth below HNW tier (over_5m routes to the estate strategies instead)",
      "income_replacement_need_uncovered = true",
      "insured_underwritable",
    ],
    uplineQuestions: [
      "What does the DIME calculation actually total, and how is the ladder layered so coverage steps down as the mortgage and dependency years burn off?",
      "Which carrier's conversion privilege is strongest (period, product availability) — the conversion right is the long-term value in this sale?",
      "Are minor-beneficiary mechanics handled (trust or UTMA, per stirpes contingents) so proceeds never land in a guardianship court?",
    ],
    sourceDoc: "AI-researched (§101(a), DIME/HLV methodology) — owner sign-off 2026-07-02",
    notes:
      "AI-researched card, approved live by owner sign-off 2026-07-02 (docs/09 validation workflow for new library entries). First and only strategy tagged to the family_legacy avatar — before this, that avatar had zero library coverage.",
  },
];
