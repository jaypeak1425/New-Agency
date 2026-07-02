// The advanced-planning-CPA lens, encoded per strategy (owner directive,
// 2026-07-02): how each library strategy stands up to a skeptical CPA's
// review, what documentation that CPA will demand before signing, and which
// federal figures (src/lib/tax-reference.ts) the case math keys off.
//
// Tiers:
//   1 — Signs off same-day: black-letter statute, no interpretive position.
//   2 — Passes with documentation: settled law, formalities-dependent — the
//       checklist below IS the CPA's file request.
//   3 — Substance-dependent: known IRS battlegrounds; passes only with real
//       economic substance, appraisals, and disciplined administration.
//
// Agent-facing (surfaces on the recommendation card and the wholesaler
// handoff) — never client copy, so plain professional language is fine here.

export type CpaTier = 1 | 2 | 3;

export const TIER_LABELS: Record<CpaTier, string> = {
  1: "CPA signs off same-day",
  2: "Passes with documentation",
  3: "Substance-dependent — audit battleground",
};

export interface CpaScrutinyEntry {
  tier: CpaTier;
  verdict: string;
  checklist: string[];
  taxRefKeys: string[];
}

export const CPA_SCRUTINY: Record<string, CpaScrutinyEntry> = {
  "survivorship-second-to-die": {
    tier: 2,
    verdict:
      "Settled ILIT law — the CPA's questions are all about trust administration, not the strategy.",
    checklist: [
      "Executed irrevocable trust; trust is original applicant/owner/beneficiary",
      "Annual Crummey notices with real withdrawal windows, kept on file",
      "Gift-tax returns reporting trust gifts (and any GST allocation)",
      "Death-benefit sizing memo tied to a projected estate-tax liability at second death",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "annual_gift_exclusion"],
  },
  "premium-financed-life-insurance": {
    tier: 2,
    verdict:
      "Tax treatment is clean; the CPA's scrutiny is economic — rate risk, collateral calls, and the fact that the loan interest generally isn't deductible.",
    checklist: [
      "Loan documents at adequate stated interest (or AFR if intra-family)",
      "Written exit strategy modeled at stressed interest rates",
      "Annual collateral-position review on file",
      "Confirmation no interest deduction is being claimed (policy-related interest)",
    ],
    taxRefKeys: ["estate_gift_gst_exemption"],
  },
  "estate-funding": {
    tier: 2,
    verdict:
      "Same settled ILIT chassis as survivorship — first-death timing analysis is what the CPA wants documented.",
    checklist: [
      "Liquidity-at-first-death analysis (state estate tax, non-citizen spouse, business obligations)",
      "Trust as original owner, new-issue policy (no three-year lookback exposure)",
      "Crummey notice file and gift-tax returns",
      "If a closely held business: the installment-deferral comparison memo",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "annual_gift_exclusion"],
  },
  grats: {
    tier: 2,
    verdict:
      "Court-blessed and regulation-defined; administration discipline is everything — a late annuity payment can unwind a valid structure.",
    checklist: [
      "Attorney-drafted trust meeting the qualified-annuity regulations",
      "Independent appraisal for any hard-to-value contribution",
      "Annuity payments made exactly on schedule (documented, in cash or appraised in-kind)",
      "Mortality-hedge policy in force for the term; no GST allocation during the term",
    ],
    taxRefKeys: ["estate_gift_gst_exemption"],
  },
  "quiet-wealth-transfer": {
    tier: 1,
    verdict:
      "Accelerates tax into the client's lower bracket rather than avoiding it — CPAs like the honesty; they'll want to run the breakeven math themselves.",
    checklist: [
      "Bracket analysis: client's rate on annuity income vs. heirs' projected rates under the 10-year rule",
      "Annuity purchased inside the IRA with distributions satisfying RMDs",
      "Trust as original policy owner; Crummey notices documented",
      "After-tax income comfortably carries the premium (no lapse risk memo)",
    ],
    taxRefKeys: [
      "ordinary_brackets_mfj",
      "ordinary_brackets_single",
      "estate_gift_gst_exemption",
      "annual_gift_exclusion",
      "rmd_age",
    ],
  },
  "rmd-repositioning": {
    tier: 1,
    verdict:
      "The cleanest position in the library: the tax is already being paid on a forced distribution — redirecting the after-tax dollars is unassailable.",
    checklist: [
      "RMD calculation confirmed (age, account balances, factors)",
      "After-tax RMD vs. premium schedule (no shortfall funding from other assets unplanned)",
      "Trust as original owner; Crummey notices documented",
    ],
    taxRefKeys: ["rmd_age", "annual_gift_exclusion", "ordinary_brackets_mfj"],
  },
  "roth-plus-life": {
    tier: 1,
    verdict:
      "Bracket-managed conversions are CPA bread-and-butter — expect them to want ownership of the conversion schedule, which is exactly right.",
    checklist: [
      "Multi-year conversion schedule filling target brackets (conversions are irrevocable)",
      "Conversion tax paid from outside funds where possible",
      "Life policy MEC-tested; face amount tied to the conversion-tax outlay",
      "AMT and IRMAA side-effects of each conversion year reviewed",
    ],
    taxRefKeys: ["ordinary_brackets_mfj", "ordinary_brackets_single", "standard_deduction", "amt"],
  },
  "annuity-rescue": {
    tier: 1,
    verdict:
      "Statutory exchange treatment; the CPA checks basis tracking and that the transfer was carrier-to-carrier, never constructive receipt.",
    checklist: [
      "Direct carrier-to-carrier assignment paperwork (never surrender-and-repurchase)",
      "Basis and gain carryover documented on the new contract",
      "Surrender-charge and rider-value comparison memo",
      "Source of funds confirmed non-qualified for any exchange path",
    ],
    taxRefKeys: ["ltc_per_diem", "niit"],
  },
  "qualified-ltc": {
    tier: 1,
    verdict:
      "Statutory since 2006; the CPA verifies the contract is tax-qualified and benefit design respects the per-diem cap and the spouse-IRA rule.",
    checklist: [
      "Contract certified tax-qualified (chronic-illness triggers, consumer protections)",
      "Benefit design vs. the per-diem limitation documented",
      "Each spouse's IRA funds only that spouse's individual benefit",
      "For exchanges: direct assignment paperwork and basis carryover",
    ],
    taxRefKeys: ["ltc_per_diem", "rmd_age"],
  },
  "ilit-foundation-wrapper": {
    tier: 2,
    verdict:
      "Sixty years of settled law that still fails audits on formalities — the CPA asks for the Crummey file before anything else.",
    checklist: [
      "Trust executed before policy application; trust as original owner",
      "Annual Crummey letters, actual notice windows, no pre-arranged waivers",
      "Gift-tax returns on file for trust gifts",
      "Independent trustee (or documented analysis if a family trustee)",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "annual_gift_exclusion"],
  },
  slat: {
    tier: 2,
    verdict:
      "Mainstream post-OBBBA — the CPA's one hard question is reciprocal-trust exposure when both spouses create them.",
    checklist: [
      "Materially differentiated trust terms, funding dates, and assets between spouses' trusts",
      "Gift-tax return reporting the exemption use",
      "Divorce/predecease contingency analysis in the file",
      "Grantor-trust status intentional and documented",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "annual_gift_exclusion"],
  },
  "dynasty-gst-trust": {
    tier: 2,
    verdict:
      "The law is settled; the failure mode is a missed GST allocation — which is literally the CPA's form to file.",
    checklist: [
      "GST exemption affirmatively allocated on a timely gift-tax return",
      "Allocation tracking schedule maintained (GST exemption is not portable)",
      "Trust situs supports the intended duration",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "annual_gift_exclusion"],
  },
  "private-split-dollar-loan-regime": {
    tier: 2,
    verdict:
      "Regulation-defined; passes when the loan is real — note, interest, and repayment mechanics actually observed.",
    checklist: [
      "Split-dollar loan agreement + promissory note at the applicable federal rate",
      "Interest actually accrued/paid and reported consistently",
      "Collateral assignment filed with the carrier",
      "Estate-side plan for the loan receivable",
    ],
    taxRefKeys: ["estate_gift_gst_exemption"],
  },
  "installment-sale-idgt": {
    tier: 3,
    verdict:
      "Universally used at the high end but built on a revenue ruling plus case law, not statute — the CPA does it, with armor on.",
    checklist: [
      "Seed gift of roughly 10% of the sale price before the note",
      "Independent appraisal of the asset sold (discounts substantiated)",
      "Note payments actually made on schedule from trust cash flow",
      "Grantor-trust trigger (e.g., swap power) documented; no retained-control facts",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "corporate_rate"],
  },
  "wealth-replacement-crt": {
    tier: 2,
    verdict:
      "Statutory with IRS pre-approved forms; the CPA verifies the remainder test and administers the four-tier accounting.",
    checklist: [
      "10% remainder-interest test computed and passed at funding",
      "Contribution appraisal and charitable deduction substantiation",
      "Four-tier accounting for the income stream each year",
      "Replacement-trust policy sized against the charity-bound value",
    ],
    taxRefKeys: ["ltcg_thresholds", "niit", "estate_gift_gst_exemption"],
  },
  "flp-fllc-discounted-gifting": {
    tier: 3,
    verdict:
      "The classic audit battleground — passes only with genuine non-tax purpose, real formalities, and appraisal-supported discounts.",
    checklist: [
      "Documented non-tax business purpose for the entity",
      "Independent appraisal supporting every discount taken",
      "Entity formalities: separate accounts, no personal-expense commingling, real distributions",
      "No deathbed funding or gifting; retained-control facts scrubbed",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "annual_gift_exclusion"],
  },
  "section-162-executive-bonus-reba": {
    tier: 1,
    verdict:
      "Ordinary compensation with a policy attached — the CPA's only question is reasonableness, and only for owner-adjacent executives.",
    checklist: [
      "Reasonable-compensation support for the bonused executive",
      "Bonus reported on the executive's W-2 (gross-up documented if used)",
      "Restrictive endorsement filed if vesting strings attach",
    ],
    taxRefKeys: ["ordinary_brackets_single", "corporate_rate"],
  },
  "buy-sell-life-insurance": {
    tier: 1,
    verdict:
      "Post-Connelly, cross-purchase or an insurance LLC is exactly what CPAs now recommend — entity redemption is where they stop you, and the card already routes around it.",
    checklist: [
      "Agreement structure reviewed against Connelly (redemption designs restructured or priced for inclusion)",
      "Valuation formula meets the bona fide/arm's-length tests; refreshed against funding",
      "Transfer-for-value exception identified for any policy transfers",
      "Entity-owned policies: notice-and-consent before issue + annual employer-owned-insurance reporting",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "corporate_rate"],
  },
  "key-person-life-insurance": {
    tier: 1,
    verdict:
      "No tax position at all — a compliance checklist: consent before issue and the annual information return, or the proceeds turn taxable.",
    checklist: [
      "Signed notice-and-consent BEFORE policy issue, in the carrier file",
      "Annual employer-owned-insurance information return filed",
      "Face-amount sizing memo (compensation multiple or contribution-to-earnings)",
      "Premiums treated as non-deductible",
    ],
    taxRefKeys: ["corporate_rate"],
  },
  "coli-corporate-reserve": {
    tier: 2,
    verdict:
      "Statutory treatment; the CPA models entity-specific effects and polices the MEC line and interest-disallowance exposure.",
    checklist: [
      "Notice-and-consent + annual reporting for every insured",
      "Seven-pay/MEC testing on the funding schedule (crossing is permanent)",
      "Interest-disallowance analysis if the company carries debt",
      "Entity-specific modeling: C-corp earnings-and-profits or S-corp basis/AAA treatment",
    ],
    taxRefKeys: ["corporate_rate"],
  },
  "nqdc-serp-coli": {
    tier: 2,
    verdict:
      "A drafting minefield with a well-worn path — the CPA signs when the plan document is clean and the payroll mechanics are wired.",
    checklist: [
      "Deferred-comp document reviewed for permissible distribution triggers (no discretion to accelerate)",
      "FICA special-timing rule applied at vesting",
      "Deduction taken only as benefits are paid",
      "Informal-funding policy consented and reported; rabbi trust documented if used",
    ],
    taxRefKeys: ["ordinary_brackets_single", "corporate_rate"],
  },
  "endorsement-split-dollar": {
    tier: 2,
    verdict:
      "Regulation-defined economic-benefit arrangement — passes when the annual term cost actually hits the W-2 every year.",
    checklist: [
      "Written split-dollar agreement + endorsement filed with the carrier",
      "Annual economic-benefit cost computed and reported on the executive's W-2 (or paid by the executive)",
      "Rollout treated as a planned taxable event with projected values",
      "Consent-before-issue and annual reporting (employer-owned policy)",
    ],
    taxRefKeys: ["ordinary_brackets_single", "corporate_rate"],
  },
  "qprt-insurance-hedge": {
    tier: 2,
    verdict:
      "A statutory exception the CPA respects — with the basis trade-off analysis and a real post-term lease as the file's centerpieces.",
    checklist: [
      "Estate-tax-saved vs. basis-step-up-lost analysis for this residence",
      "Appraisal at funding; gift-tax return reporting the discounted remainder",
      "Post-term market-rent lease, actually paid, on file",
      "Mortality-hedge policy in force for the term",
    ],
    taxRefKeys: ["estate_gift_gst_exemption", "ltcg_thresholds"],
  },
  ppli: {
    tier: 3,
    verdict:
      "Solid under current law but fact-intensive and legislatively targeted — a conservative CPA demands bright-line investor-control hygiene and written risk disclosure.",
    checklist: [
      "Written investor-control counseling: allocate among funds, never direct investments",
      "Diversification certification for every insurance-dedicated fund",
      "All-in cost vs. annual tax-drag analysis (the case stands or falls here)",
      "Pending-legislation risk disclosure in the client file (proposed bill introduced April 2026)",
    ],
    taxRefKeys: ["niit", "ltcg_thresholds", "estate_gift_gst_exemption"],
  },
  "clat-wealth-replacement": {
    tier: 2,
    verdict:
      "Statutory mirror of the CRT — the CPA prices the phantom-income trade on grantor versions before anyone signs.",
    checklist: [
      "Grantor vs. non-grantor election analysis (deduction now vs. phantom income later)",
      "Zeroed-out computation against the month's benchmark rate",
      "Charitable payments actually made on schedule",
      "Replacement policy sized to the inheritance target",
    ],
    taxRefKeys: ["ordinary_brackets_mfj", "estate_gift_gst_exemption", "ltcg_thresholds"],
  },
  "family-income-legacy": {
    tier: 1,
    verdict: "No tax controversy exists — the CPA's only note is beneficiary hygiene for minors.",
    checklist: [
      "Needs analysis on file (debts, income years, mortgage, education)",
      "Beneficiary designations reviewed (trust/custodial arrangements for minors, contingents named)",
    ],
    taxRefKeys: ["standard_deduction"],
  },
};
