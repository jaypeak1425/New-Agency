import type { ConceptLibraryEntry } from "./concept-library-types";

// Business Owner & Executive Benefits + Qualified Money & Retirement
// concepts — agent-facing Library content (case study + top-10 CPA/client
// questions). Case studies are illustrative composites, never a real client.

export const BUSINESS_EXECUTIVE_CONCEPTS: Record<string, ConceptLibraryEntry> = {
  "buy-sell-life-insurance": {
    category: "business_executive",
    caseStudy: {
      title: "Two partners, one heart attack from chaos",
      situation:
        "Two 50/50 owners of a $9M S-corp, ages 50 and 49, both insurable. A handshake understanding, no funded agreement. If either dies, the survivor is suddenly in business with a grieving spouse who needs income and has a vote.",
      design:
        "Counsel drafts a cross-purchase agreement with a valuation formula; each owner buys life coverage on the other, sized to their half of the company. Post-Connelly, cross-purchase (or an insurance-LLC variant) is preferred over entity redemption so the death benefit doesn't inflate the company's own estate-tax value.",
      outcome:
        "At a death, the survivor buys the decedent's interest at the agreed price with non-taxable proceeds: the family gets full fair value in cash, the survivor gets an undisputed company and a stepped-up basis in the purchased interest. The annual review re-syncs coverage to company value — the most commonly skipped step.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why does Connelly change the structure choice?", a: "Connelly v. United States (2024) held company-owned death benefit inflates the entity's estate-tax value without an offset for the redemption obligation — pushing well-advised cases toward cross-purchase or a special-purpose insurance LLC." },
      { asker: "cpa", q: "Are the premiums deductible?", a: "No — buy-sell premiums are nondeductible personal/capital outlays whoever pays them; the payoff is the non-taxable death benefit and a clean transfer, not a write-off." },
      { asker: "client", q: "What price does my family actually get?", a: "The agreement's price — a formula or appraisal process you set while everyone's healthy and friendly. Without it, the price gets set during the worst month of their lives." },
      { asker: "cpa", q: "Will the agreement's price fix estate-tax value?", a: "Only if it meets §2703's tests (bona fide business arrangement, not a device, comparable to arm's-length) — family businesses especially need a defensible formula and periodic updates." },
      { asker: "client", q: "Cross-purchase with 3+ owners is a lot of policies. Alternatives?", a: "An insurance LLC holding one policy per owner solves the N×(N-1) explosion and keeps proceeds outside the operating company — the modern default for multi-owner groups." },
      { asker: "client", q: "What about disability or divorce, not just death?", a: "Good agreements cover the 'Ds' — death, disability, divorce, departure, default. Disability buyout insurance funds that trigger; the drafting conversation covers all of them." },
      { asker: "cpa", q: "Basis consequences by structure?", a: "Cross-purchase gives survivors a cost basis step-up in the purchased interest; redemption generally doesn't — a real after-tax difference at the eventual sale." },
      { asker: "client", q: "We did a buy-sell eight years ago. Are we done?", a: "Almost certainly not — the company's value has moved and the coverage hasn't. An unfunded gap between agreement price and death benefit is a silent liability on the survivor." },
      { asker: "cpa", q: "Transfer-for-value traps when restructuring?", a: "Yes — moving existing policies between owners/entities can taint proceeds as taxable under §101(a)(2) unless an exception applies (partner exceptions are the workhorse). Route restructures through counsel." },
      { asker: "client", q: "What does the §101(j) rule have to do with us?", a: "Any employer-owned policy needs written notice and consent before issue or the death benefit can become taxable — a one-page formality that's malpractice to skip (hard rule in this engine)." },
    ],
  },

  "key-person-life-insurance": {
    category: "business_executive",
    caseStudy: {
      title: "The rainmaker the bank was actually lending to",
      situation:
        "A $14M-revenue engineering firm, one principal whose license, relationships, and name drive ~40% of revenue. The credit line quietly assumes he shows up Monday. He's 47, standard health, and uninsured by the company.",
      design:
        "Company applies for key person coverage on him — sized on a multiple-of-contribution method — with §101(j) notice and consent signed before issue. The company is owner and beneficiary; the board minutes record the insurable-interest rationale.",
      outcome:
        "If the key person dies, the company receives non-taxable proceeds to cover the revenue gap, recruit and train a successor, calm the bank, and buy time. The CPA's file: the consent, the sizing memo, and annual Form 8925 with the return.",
    },
    topQuestions: [
      { asker: "cpa", q: "Is the premium deductible?", a: "No — §264 bars deducting premiums where the company is beneficiary. The trade is nondeductible premium for non-taxable proceeds under §101(a), preserved by §101(j) compliance." },
      { asker: "cpa", q: "What exactly does §101(j) require?", a: "Written notice to the employee and their consent BEFORE issue, plus annual Form 8925 reporting. Skip it and the death benefit above basis becomes taxable income — unfixable after issue (hard rule)." },
      { asker: "client", q: "How much coverage is defensible?", a: "A documented method: multiple of compensation (5–10×), replacement-cost of revenue attribution, or cost-to-replace analysis. The memo matters as much as the number." },
      { asker: "client", q: "Term or permanent for this?", a: "Term fits a defined key-person window; permanent fits when the need is indefinite or the policy doubles as a corporate reserve asset. The need's duration decides." },
      { asker: "cpa", q: "Does the death benefit hit the company's books?", a: "Proceeds are non-taxable (with §101(j) satisfied), though C-corps should confirm no corporate AMT interaction in unusual years; book income and tax income diverge — footnote it." },
      { asker: "client", q: "What happens when the key person leaves?", a: "Options: surrender, transfer to the departing employee (watch transfer-for-value and compensation treatment), or repurpose per plan. Decide in the plan document, not ad hoc." },
      { asker: "client", q: "Can this help with the bank?", a: "Directly — lenders frequently require key person coverage on credit facilities; a collateral assignment to the bank slots straight into the same policy." },
      { asker: "cpa", q: "Insurable interest issues?", a: "The employer has a clear insurable interest in a genuine key contributor at issue — document the rationale in minutes; state law tests are applied at issue, not at claim." },
      { asker: "client", q: "Is this the same as a buy-sell?", a: "No — buy-sell moves ownership between people; key person protects the company's own income statement. Many businesses need both, and the same underwriting can serve both." },
      { asker: "cpa", q: "What if the company later becomes the policy's seller?", a: "A sale of the policy is a transfer for value with taxable-proceeds risk unless an exception applies — another route-through-counsel moment." },
    ],
  },

  "coli-corporate-reserve": {
    category: "business_executive",
    caseStudy: {
      title: "The corporate reserve that compounds quietly",
      situation:
        "C-corp with $600K/year of retained cash earning taxable money-market yield at the 21% corporate rate, two owners and two key employees the company intends to keep for decades.",
      design:
        "The corporation purchases institutionally-priced permanent life policies on the four consenting insureds (§101(j) notice and consent before issue, Form 8925 annually). Cash value grows tax-deferred as a balance-sheet asset; death benefits fund key-person needs and informally back retention promises.",
      outcome:
        "The reserve compounds without annual tax drag, stays accessible through policy loans/withdrawals if the business needs capital, and the non-taxable death benefits ultimately recover costs. The board file: consents, sizing memos, and the accounting treatment memo for the auditors.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why is §101(j) the first checklist item?", a: "Employer-owned contracts lose non-taxable death-benefit treatment without pre-issue notice and consent — it's the difference between the strategy working and a taxable surprise, and it cannot be cured after issue." },
      { asker: "cpa", q: "How does COLI sit on the financial statements?", a: "Cash surrender value is an asset; premium expense nets against CSV growth in the income statement. Auditors know the pattern — give them the memo up front." },
      { asker: "client", q: "Can we get the money out if the business hits a rough year?", a: "Policy loans and withdrawals against cash value are available (non-MEC discipline preserves basis-first treatment); the reserve is liquid enough for real contingencies while the policies stay in force." },
      { asker: "cpa", q: "Whose lives, and why does the mix matter?", a: "Owners and genuine key employees only — §101(j)'s exceptions key off highly-compensated/director status and proper consent; insuring rank-and-file broadly is both bad law and bad optics." },
      { asker: "client", q: "What does this earn versus the money market?", a: "Compare after-tax: taxable yield at 21% corporate rate versus tax-deferred policy crediting minus insurance costs — over a decade the wrapper typically wins for money the company won't spend soon; run the actual illustration." },
      { asker: "cpa", q: "Corporate AMT or book-income interactions?", a: "Large corporations under the 15% book-minimum regime should model COLI's book income; for most closely-held C-corps it's a nonissue, but the check belongs in the file." },
      { asker: "client", q: "What happens if a covered employee leaves?", a: "Keep (if insurable interest at issue was valid, coverage persists), surrender, or transfer — the plan document should say which, before it happens." },
      { asker: "cpa", q: "1035 flexibility later?", a: "Corporate-owned life can §1035 into better contracts (same insured, same owner — hard rule) as pricing improves; it's a managed asset, not a drawer document." },
      { asker: "client", q: "Is this a retirement plan for the employees?", a: "No — it's a corporate asset. Pairing it with a written SERP/deferred-comp promise is the next concept (NQDC/SERP informally funded with COLI), a deliberate second step." },
      { asker: "cpa", q: "What's the exit at business sale?", a: "Policies can be distributed, sold, or kept by the successor — each path has tax consequences (transfer-for-value, compensation income) that belong in the deal checklist early." },
    ],
  },

  "nqdc-serp-coli": {
    category: "business_executive",
    caseStudy: {
      title: "Golden handcuffs the balance sheet can keep",
      situation:
        "S-corp-turned-C-corp, $22M revenue, a 44-year-old COO the owners cannot lose to a competitor. Qualified-plan limits cap what they can do for her inside the 401(k); a raise is taxable now and buys no loyalty.",
      design:
        "A written SERP: the company promises supplemental retirement income at 60, vesting on a schedule that makes leaving expensive. The promise is unfunded and unsecured (top-hat, §409A-compliant); the company informally backs it with COLI on the COO (§101(j) consent), whose tax-deferred growth and death benefit hedge the liability.",
      outcome:
        "The COO sees a real six-figure future she forfeits by leaving; the company books a liability it has quietly pre-funded. At payout, benefits are deductible compensation; the COLI death benefit ultimately recovers plan costs. §409A discipline — election timing, distribution triggers, no acceleration — is the whole compliance game.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why must the plan stay 'unfunded'?", a: "Formal funding destroys deferral (economic benefit/§83) and ERISA top-hat status. The COLI is a general corporate asset informally earmarked — the executive is an unsecured creditor, and that's the design." },
      { asker: "cpa", q: "What does §409A actually police?", a: "Deferral elections made before the service year, fixed distribution triggers (separation, date, death, disability, change-in-control, emergency), and no acceleration — violations tax vested deferrals immediately plus a 20% penalty on the executive." },
      { asker: "client", q: "What if the company goes bankrupt?", a: "The promise is unsecured — creditors come first. A rabbi trust can protect against a change of heart or change of control, but not insolvency; that's the honest tradeoff for tax deferral." },
      { asker: "client", q: "Why not just pay her more?", a: "A raise is taxed now and walks out the door with her. The SERP defers her tax, concentrates value behind a vesting wall, and costs the company nothing deductible until it actually pays." },
      { asker: "cpa", q: "When does the company get its deduction?", a: "At payment, matching the executive's inclusion — the mirror-image timing is the corporate cost of the executive's deferral." },
      { asker: "client", q: "How does the insurance piece help?", a: "COLI grows tax-deferred against the liability, its loans/withdrawals can fund benefit payments, and the death benefit reimburses plan costs — the company's hedge, not the executive's security." },
      { asker: "cpa", q: "FICA timing trap?", a: "Deferred amounts are FICA-taxed at vesting (special timing rule), usually cheaper for everyone — miss it and the non-duplication rule's benefit is forfeited. Payroll needs to know the schedule." },
      { asker: "client", q: "Does this work for an S-corp owner herself?", a: "Poorly — an owner deferring her own pass-through income mostly rearranges her own pocket. NQDC shines for non-owner executives; owner planning uses different tools." },
      { asker: "cpa", q: "Top-hat filing?", a: "The one-time DOL top-hat statement within 120 days of adoption keeps ERISA reporting minimal — a five-minute filing that's expensive to forget." },
      { asker: "client", q: "What keeps her from suing over a forfeiture?", a: "A clean written plan: vesting schedule, triggers, claims procedure, §409A terms. The document IS the strategy — the insurance is just how the company sleeps at night." },
    ],
  },

  "endorsement-split-dollar": {
    category: "business_executive",
    caseStudy: {
      title: "Company-paid coverage the executive can feel",
      situation:
        "Bank-holding company wants a visible, cheap-to-deliver perk for a 39-year-old rising executive with young kids: meaningful family death benefit now, without handing over a policy or a raise.",
      design:
        "The company owns a permanent policy on the executive (§101(j) consent first) and endorses a slice of the death benefit to her family. Under the economic-benefit regime she's taxed annually only on the term cost of that protection — Table 2001 rates, a few hundred dollars of imputed income for seven figures of coverage at her age.",
      outcome:
        "Her family is protected at a fraction of retail term cost to her; the company keeps the cash value and its cost-recovery death benefit share, and the arrangement doubles as a retention hook (the endorsement ends if she leaves). Exit paths — rollout to her, or plan termination — are documented at inception.",
    },
    topQuestions: [
      { asker: "cpa", q: "What is she actually taxed on?", a: "The annual economic benefit — the Table 2001 (or insurer alternative) term cost of the death-benefit slice endorsed to her family — reported as compensation; young executives pay very little for a lot of coverage." },
      { asker: "cpa", q: "Economic-benefit vs. loan regime — why this one?", a: "The employer owns the policy and endorses protection out, which the final split-dollar regs tax under the economic-benefit regime; loan regime applies when the employee/trust owns and the employer lends premiums. Ownership picks the regime." },
      { asker: "client", q: "Who gets the cash value?", a: "The company — it owns the policy. Your side of the deal is the endorsed death benefit while the arrangement runs; that's why your annual cost is only the term-value tax." },
      { asker: "client", q: "What happens if I leave?", a: "The endorsement typically ends — that's the retention design. Some plans allow a rollout: buy the policy at defined terms, with tax consequences priced in advance." },
      { asker: "cpa", q: "Rollout tax mechanics?", a: "The executive buys at fair value (or is compensated with the policy — taxable); watch transfer-for-value (the insured-purchaser exception usually saves proceeds treatment) and document the valuation." },
      { asker: "client", q: "Can the endorsed benefit go to my trust?", a: "Yes — endorsing to the executive's ILIT keeps her slice outside her estate; the economic benefit then runs through her as a deemed gift to the trust, sized annually." },
      { asker: "cpa", q: "§101(j) applies here too?", a: "Fully — employer-owned contract, so pre-issue notice and consent plus Form 8925, or the company's share of proceeds turns taxable (hard rule)." },
      { asker: "client", q: "Why would the company do this instead of group term?", a: "Group term caps at modest amounts and $50K of it is the only income-tax-free layer; endorsement split-dollar delivers seven figures, selectively, with cost recovery — a targeted executive perk, not a census benefit." },
      { asker: "cpa", q: "Deductibility?", a: "None while the arrangement runs (§264 — company is an owner/beneficiary); the company's return is cash value growth and its death-benefit share, not a deduction." },
      { asker: "client", q: "Is this the strategy for MY company (I own it)?", a: "Owner-employees of C-corps can use it, but the economics fold in on themselves in pass-throughs — owners usually route to §162 bonus or personal/trust designs instead." },
    ],
  },

  "section-162-executive-bonus-reba": {
    category: "business_executive",
    caseStudy: {
      title: "The deductible perk with a vesting leash",
      situation:
        "Dental practice (S-corp) with a 36-year-old associate the owner is grooming to buy in. Wants to reward and retain her with pre-tax practice dollars, minimal administration, and something she can't take to a competitor next year.",
      design:
        "§162 executive bonus: the practice bonuses her the premium on a permanent policy SHE owns; the bonus is deductible compensation to the practice and taxable to her (often with a gross-up). A restrictive endorsement (REBA) requires practice consent to touch cash value until a 7-year vesting schedule runs.",
      outcome:
        "The practice deducts every dollar; she builds a personally-owned, portable asset with basis-first access after vesting; leaving early means walking away from the unvested value. Reasonable-compensation documentation (hard rule 7) sits in the file — total comp including the bonus must be defensible for the services rendered.",
    },
    topQuestions: [
      { asker: "cpa", q: "What makes the bonus deductible?", a: "§162(a)(1): ordinary, necessary, and REASONABLE compensation for services actually rendered. The reasonable-comp memo (role, market data, total package) is the deduction's armor — hard rule 7 in this engine." },
      { asker: "cpa", q: "Who's taxed on what, when?", a: "The executive includes the bonus as W-2 income in the year paid; the company deducts the same year. A double bonus (gross-up) covers her tax so the perk feels free — also deductible if total comp stays reasonable." },
      { asker: "client", q: "If she owns the policy, what stops her leaving?", a: "The REBA endorsement: the insurer won't process surrenders, loans, or withdrawals without company consent until vesting. Ownership is hers; access is leashed." },
      { asker: "client", q: "What does she get long-term?", a: "A permanent policy she keeps regardless of employer: non-taxable death benefit for her family, tax-deferred cash value, basis-first access after vesting — a portable executive asset." },
      { asker: "cpa", q: "Does §409A apply?", a: "Properly structured, no — the bonus is current compensation, not deferred; the restrictive endorsement limits her access to her own property rather than deferring the employer's payment. Keep the structure clean to stay outside 409A." },
      { asker: "client", q: "Why this over a bigger 401(k) match?", a: "Qualified plans are capped, nondiscrimination-tested, and cover everyone. §162 bonus is selective — one executive, any amount that stays reasonable, no plan document or testing." },
      { asker: "cpa", q: "S-corp owner using this on herself?", a: "Ineffective — the deduction and the income land on the same 1040. It's a tool for non-owner (or minority) executives; >2% S-corp shareholders route elsewhere." },
      { asker: "client", q: "What happens at the end of vesting?", a: "The endorsement releases; the policy is unencumbered hers. Many plans time it to a buy-in date — the policy becomes part of her equity story." },
      { asker: "cpa", q: "MEC discipline on her policy?", a: "Yes — fund inside §7702A seven-pay so lifetime access stays basis-first; a MEC is irrevocable (hard rule) and would gut the living-benefit story." },
      { asker: "client", q: "How is this different from the SERP we discussed?", a: "Mirror images: §162 bonus = her asset, company deduction now, REBA leash. SERP = company's unsecured promise, deduction later, stronger handcuffs but bankruptcy risk on her side. Choose by who should hold the asset." },
    ],
  },
};

export const QUALIFIED_RETIREMENT_CONCEPTS: Record<string, ConceptLibraryEntry> = {
  "rmd-repositioning": {
    category: "qualified_retirement",
    caseStudy: {
      title: "The RMDs he never wanted, put to work",
      situation:
        "Retired engineer, 74, $2.8M IRA, pension and Social Security already cover his lifestyle. RMDs arrive as unwanted taxable income every year, get taxed, and pile up in a brokerage account — future estate tax base, plus a 10-year-drain SECURE-Act problem for his kids.",
      design:
        "Each year's after-tax RMD funds premiums on a survivorship (or single-life) policy owned by an ILIT for the children. The forced distribution becomes the funding stream; the annual exclusion covers the gifts; the trust owns from inception.",
      outcome:
        "A taxable, compounding problem converts into a non-taxable, estate-tax-free death benefit — typically a multiple of the premiums at their ages. The kids inherit trust proceeds free of the 10-year rule instead of a bigger IRA inside it. His CPA's question — 'why buy insurance at 74?' — is answered by the arbitrage math in the file.",
    },
    topQuestions: [
      { asker: "cpa", q: "Isn't insurance at 74 expensive?", a: "Priced per dollar of premium, yes; priced per after-tax dollar delivered to heirs versus the do-nothing path (taxed RMD → taxed growth → estate base → 10-year inherited-IRA drain), the policy IRR to life expectancy routinely wins. Run the comparison, don't assert it." },
      { asker: "cpa", q: "Does this change his RMD taxation?", a: "No — RMDs stay taxable ordinary income (that's hard rule 2 territory: qualified money moves by distribution, never §1035). The strategy repositions the after-tax remainder; it doesn't dodge the distribution." },
      { asker: "client", q: "Why involve a trust?", a: "Owned personally, the death benefit lands back in your taxable estate — undoing half the point. The ILIT keeps proceeds outside the estate and controls how the kids receive them." },
      { asker: "client", q: "What if I need the money later?", a: "Fund only what surplus RMDs support, keep the IRA itself untouched as the reserve, and size conservatively — the design assumes the pension/SS floor holds; if it doesn't, premiums can flex on a properly built policy." },
      { asker: "cpa", q: "Underwriting at this age?", a: "The gating item — the engine asks health first. Standard-or-better at 74 keeps the math strong; significant impairments shift the design toward survivorship pricing or smaller face." },
      { asker: "client", q: "How do the grandkids fit?", a: "Allocate GST exemption to the trust gifts and the death benefit can skip a generation of estate tax entirely — the dynasty variant of the same move." },
      { asker: "cpa", q: "Why is this better than QCDs?", a: "Different goals: QCDs zero the tax on charitable dollars; this multiplies family-bound dollars. Charitably-inclined clients often run both — QCD to the giving target, reposition the rest." },
      { asker: "client", q: "What does SECURE change about doing nothing?", a: "Non-spouse heirs must drain the inherited IRA within 10 years — compressed, often peak-earning-year taxation. Every dollar moved to trust-owned insurance exits that regime as non-taxable proceeds instead." },
      { asker: "cpa", q: "Roth conversion versus this?", a: "Complements, not rivals: conversions pre-pay tax to detoxify the IRA; repositioning leverages the already-forced distributions. The blend depends on bracket runway — model both against the estate picture." },
      { asker: "client", q: "When does this NOT make sense?", a: "If RMDs fund your lifestyle, if health blocks reasonable underwriting, or if the estate will never face tax and heirs are in low brackets — then simpler answers win. The intake gates all three." },
    ],
  },

  "roth-plus-life": {
    category: "qualified_retirement",
    caseStudy: {
      title: "Paying the IRS once, on purpose, at a discount",
      situation:
        "Couple, 61 and 60, $1.9M in traditional IRAs, retiring at 62 with Social Security deferred to 70. Ages 62–72 are a valley of unusually low brackets before RMDs and both SS checks stack income back up.",
      design:
        "A conversion ladder fills the 22%/24% brackets each valley year, moving IRA money to Roth at rates they'll never see again. Alongside it, a permanent policy on the healthier spouse — funded from taxable-account cash flow — adds a non-taxable death benefit and a tax-diversified cash-value pocket.",
      outcome:
        "By 72, most qualified money is Roth (no RMDs, non-taxable growth, 10-year-rule-proof for the kids); the policy backstops the survivor (whose filing status flips to single — the widow's penalty) and gives late-life planning room. The conversion memo — brackets filled, IRMAA cliffs respected — is the CPA's favorite page.",
    },
    topQuestions: [
      { asker: "cpa", q: "What are the conversion guardrails?", a: "Fill target brackets without tripping IRMAA surcharge cliffs (2-year lookback), NIIT thresholds, or SS-taxation interactions; pay conversion tax from outside funds; December precision beats January guessing." },
      { asker: "cpa", q: "Why does the insurance belong in a tax plan?", a: "It's the third tax bucket: non-taxable death benefit under §101(a), tax-deferred cash value with basis-first access, immune to future bracket legislation — diversification against tax-law risk itself." },
      { asker: "client", q: "Why convert at all if rates might drop?", a: "Your own schedule is the argument: the valley years are YOUR low-rate window regardless of Congress — RMDs plus two Social Security checks close it on a known date." },
      { asker: "client", q: "Which spouse gets insured?", a: "Usually the healthier/younger for pricing, with the survivor's economics in view: the widow(er) files single at compressed brackets on mostly-unchanged income — the death benefit plugs exactly that hole." },
      { asker: "cpa", q: "Five-year rules on converted money?", a: "Each conversion has its own 5-year clock for penalty-free access before 59½; past 59½ the concern is mostly the earnings clock on the first Roth. At these ages it's a footnote, but it goes in the memo." },
      { asker: "client", q: "What do the kids inherit?", a: "Roth: 10-year drain but non-taxable. Insurance: immediate, non-taxable, outside the 10-year rule (and outside the estate if trust-owned). Both beat a traditional IRA's compressed taxable drain." },
      { asker: "cpa", q: "Why not convert everything at once?", a: "One giant conversion spikes into 32–37% brackets and IRMAA — destroying the arbitrage the ladder exists to capture. The valley is harvested annually, not strip-mined." },
      { asker: "client", q: "Where does the conversion tax money come from?", a: "Taxable accounts, ideally — paying from the IRA shrinks the amount actually converted and wastes the shelter. That's also why the policy premium competes with, and is budgeted against, the same cash flow." },
      { asker: "cpa", q: "MEC and funding discipline on the policy?", a: "Non-MEC seven-pay funding keeps lifetime access basis-first (hard rule: MEC is irrevocable); the policy is built for flexibility, not maximum-stuffed." },
      { asker: "client", q: "What if we need long-term care instead?", a: "Riders can accelerate the death benefit for chronic illness (non-taxable within the per-diem limits), letting the same asset hedge the care risk — the qualified-LTC concept next door formalizes this." },
    ],
  },

  "annuity-rescue": {
    category: "qualified_retirement",
    caseStudy: {
      title: "The forgotten annuity with a tax bomb in the drawer",
      situation:
        "Widow, 67, holds a non-qualified deferred annuity: $260K value, $90K basis, bought in 1998 and untouched. She doesn't need the income; her son will inherit it — and $170K of gain as ordinary income, with no step-up and no 10-year deferral kindness.",
      design:
        "After the health gate (she's insurable), a §1035 exchange moves the contract tax-free into a modern annuity with an enhanced death benefit — or, in the fuller design, annuitized/systematic distributions fund an ILIT-owned life policy, converting taxable-forever gain into non-taxable death benefit. Hard rules enforced: §1035 only works non-qualified-to-like-kind, same owner; annuity-to-LIFE directly is never valid — the SPIA-bridge structure is the lawful path.",
      outcome:
        "Instead of inheriting an income-tax bill, her son inherits either an enhanced, cleaner contract or trust-held life proceeds — non-taxable under §101(a), outside her estate. The gain either dissipates through taxed-as-received annuity payments doing useful work, or stays deferred in a better wrapper.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why can't the annuity just 1035 into life insurance?", a: "§1035's permitted list runs life→life, life→annuity, annuity→annuity — never annuity→life (hard rule 1). The lawful route is distributions (taxed as received) or a SPIA whose payments fund the life premiums." },
      { asker: "cpa", q: "How are the funding distributions taxed?", a: "Deferred-annuity withdrawals are gain-first (LIFO) ordinary income; annuitized/SPIA payments spread an exclusion ratio across each check — usually the gentler path, which is why the SPIA bridge is the standard design." },
      { asker: "client", q: "What's actually wrong with keeping the old contract?", a: "Nothing is 'wrong' — it's that the gain never gets a step-up: your son inherits it as ordinary income at HIS bracket. The rescue decides where that tax lands, on purpose, at the best available rates." },
      { asker: "client", q: "What if I'm not insurable?", a: "Then the life leg is off the table and the design pivots (the engine does this automatically): a §1035 to a better annuity — lower costs, enhanced death benefit, or LTC-hybrid features — still improves the inheritance." },
      { asker: "cpa", q: "Partial 1035s?", a: "Permitted, with a 180-day anti-abuse watch on subsequent distributions from either contract — useful for splitting a contract into an income leg and a transfer leg." },
      { asker: "client", q: "Is there a penalty at my age?", a: "No — the 10% pre-59½ penalty is behind you; ordinary income treatment on gain is the only tax friction, and the design's whole point is to route it well." },
      { asker: "cpa", q: "Surrender charges and lost riders?", a: "The suitability file must show the exchange clears surrender costs and that no valuable legacy rider (old GMIB, grandfathered features) is being torched — that comparison is regulatory table stakes." },
      { asker: "client", q: "Why does the trust matter here too?", a: "Life proceeds owned personally land in your estate; ILIT ownership from inception keeps the rescued value outside it — same §2035/§2042 discipline as every trust-owned design." },
      { asker: "cpa", q: "What about a qualified annuity — same playbook?", a: "No — qualified money moves by rollover/transfer under plan rules, never §1035 (hard rule 2), and RMD rules dominate. That's the RMD-repositioning concept, not this one." },
      { asker: "client", q: "How long does this take?", a: "Underwriting drives it: health questions first, illustration second, exchange paperwork last — typically 6–10 weeks, and nothing is surrendered until the new structure is approved and in force." },
    ],
  },

  "qualified-ltc": {
    category: "qualified_retirement",
    caseStudy: {
      title: "The care plan that doesn't torch the nest egg",
      situation:
        "Couple, 63 and 61, $1.4M saved, both watched a parent's estate drain through five years of care. Standalone LTC quotes offended them ('use it or lose it'); self-insuring quietly earmarks $400K they can never invest confidently.",
      design:
        "Hybrid life/LTC policies (§7702B riders) funded from taxable savings — each spouse's policy provides a pool of LTC benefits (non-taxable within the per-diem limits, $430/day in 2026), and an unused pool pays out as a non-taxable death benefit instead of evaporating. HARD RULE 8 enforced: each spouse's coverage is funded individually — one spouse's IRA can never fund joint LTC benefits.",
      outcome:
        "Care risk is capped with dollars that were already earmarked, 'use it or lose it' disappears (someone always collects — the couple in care, or the kids at death), and the rest of the portfolio is liberated to invest normally. Premiums are locked/guaranteed on the chosen chassis — the failure mode of the old standalone market.",
    },
    topQuestions: [
      { asker: "cpa", q: "How are LTC benefits taxed?", a: "Qualified §7702B benefits are non-taxable — per-diem/indemnity payments within the annually-indexed limit ($430/day in 2026, Rev. Proc. 2025-32); reimbursement designs are non-taxable to actual cost without that cap." },
      { asker: "cpa", q: "What does hard rule 8 actually block?", a: "Funding JOINT LTC benefits from one spouse's IRA — a prohibited-transaction/ownership mismatch. Each spouse's qualified money can fund only their OWN coverage; joint designs need non-qualified dollars." },
      { asker: "client", q: "What if we never need care?", a: "That's the hybrid's answer to 'use it or lose it': the unused benefit pool pays your beneficiaries as a non-taxable death benefit. Someone in the family always collects." },
      { asker: "client", q: "What triggers the benefits?", a: "The §7702B standard: certified inability to perform 2 of 6 activities of daily living (or severe cognitive impairment), expected 90+ days, under a care plan — certification by a licensed practitioner, renewed annually." },
      { asker: "cpa", q: "Are the premiums deductible?", a: "The rider's LTC portion may qualify as a medical expense within age-banded limits (rarely useful post-standard-deduction); business owners have richer routes — C-corp-paid LTC is deductible and excludable, a planning door worth opening." },
      { asker: "client", q: "Why not just self-insure — we have $1.4M?", a: "You can — but the earmarked $400K must then sit invested 'safely' forever, and a five-year tail-risk event still breaks the plan. The hybrid caps the tail for a known premium and refunds the family if the risk never lands." },
      { asker: "cpa", q: "1035 angles into these?", a: "Yes — existing life or annuity value can §1035 (like-kind rules and hard rules 1–3 enforced) into hybrid designs, letting trapped gain fund care benefits non-taxable; PPA §844 blessed the annuity-LTC combination." },
      { asker: "client", q: "Home care or just facilities?", a: "Qualified plans cover the continuum — home care, assisted living, memory care, skilled nursing — per the policy's schedule; home care is where most claims start and most clients care most." },
      { asker: "cpa", q: "Inflation protection worth the cost?", a: "At 61–63, usually yes on at least one spouse — care costs compound faster than CPI; the memo should show the benefit pool at 85 with and without the rider." },
      { asker: "client", q: "What happens if we stop paying?", a: "Chassis-dependent: guaranteed designs carry reduced paid-up values so accumulated premium isn't forfeited. It's a contract question the illustration answers before purchase — ask it there, not at year ten." },
    ],
  },
};
