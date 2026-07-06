import type { ConceptLibraryEntry } from "./concept-library-types";

// Advanced Wealth Transfer + Charitable concepts — agent-facing Library
// content (case study + top-10 CPA/client questions). Case studies are
// illustrative composites, never a real client.

export const WEALTH_TRANSFER_CONCEPTS: Record<string, ConceptLibraryEntry> = {
  grats: {
    category: "wealth_transfer",
    caseStudy: {
      title: "Gifting the growth, keeping the principal",
      situation:
        "Founder, 52, holding pre-liquidity company stock she believes will multiply within five years. She's reluctant to burn lifetime exemption on an outright gift — and doesn't need to.",
      design:
        "Two-year rolling zeroed-out GRATs: stock goes in, the trust pays her back the full value plus the §7520 hurdle rate as an annuity, and everything the stock earns above the hurdle passes to the children's trust at a gift value of approximately zero.",
      outcome:
        "The first GRAT catches a 34% run-up — the excess moves out of her estate gift-tax-free. A flat GRAT simply returns her property with nothing lost but paperwork. Heads the family wins, tails they break even; the rolling structure keeps re-rolling the dice.",
    },
    topQuestions: [
      { asker: "cpa", q: "How does 'zeroed-out' work?", a: "The retained annuity is set so its present value at the §7520 rate equals the funded amount — the taxable gift of the remainder rounds to (nearly) zero under Walton." },
      { asker: "cpa", q: "What's the mortality risk?", a: "Death during the term pulls the GRAT assets back into the estate (§2036) — the reason terms run short and an insurance hedge is often paired for larger GRATs." },
      { asker: "client", q: "What if the asset underperforms the hurdle?", a: "The annuity just returns your property; you've lost transaction costs, not exemption, not principal. That asymmetry is the strategy's charm." },
      { asker: "cpa", q: "Why short rolling terms instead of one long GRAT?", a: "Shorter terms reduce mortality risk and prevent one bad year from swamping good ones — each rolling GRAT captures its own upside independently." },
      { asker: "client", q: "Do I pay income tax on the GRAT's earnings?", a: "Yes — it's a grantor trust; you pay the income tax, which quietly shifts even more value to the remainder beneficiaries without gift-tax cost." },
      { asker: "cpa", q: "Valuation discipline on hard-to-value assets?", a: "Qualified appraisal at funding, and a revaluation clause (annuity defined as a percentage of initial value) so an IRS revaluation adjusts the annuity instead of creating a gift." },
      { asker: "client", q: "Can the GRAT hold my company's S-corp stock?", a: "Generally yes — grantor trusts are eligible S shareholders; the operating agreement and transfer restrictions get checked first." },
      { asker: "cpa", q: "GST planning inside a GRAT?", a: "Poor fit — the ETIP rule prevents GST allocation until the term ends, at then-current values. Skip-generation goals route through other vehicles." },
      { asker: "client", q: "When is the window most attractive?", a: "Low §7520 rates and a depressed or pre-growth asset value — you're betting appreciation beats a published hurdle, so a low hurdle is half the game." },
      { asker: "cpa", q: "Legislative risk?", a: "Minimum-term and minimum-remainder proposals resurface regularly; the strategy is fully legal today, and existing GRATs are typically grandfathered — a reason to act while the door is open." },
    ],
  },

  "installment-sale-idgt": {
    category: "wealth_transfer",
    caseStudy: {
      title: "Selling the company to a trust that's ignored for income tax",
      situation:
        "Owner, 58, S-corp worth $20M growing ~12%/yr, already used most of his lifetime exemption. Gifting more is off the table; doing nothing hands the growth to the estate-tax base.",
      design:
        "He seeds an intentionally defective grantor trust with a 10% gift, then sells non-voting shares (appraised with valuation discounts) to the trust for a promissory note at the AFR. Because the trust is a grantor trust, the sale triggers no capital gain and the note interest isn't taxable income to him.",
      outcome:
        "All growth above the modest AFR compounds outside his estate; note payments return frozen value to him. Trust-owned life insurance on the grantor hedges the note balance against an early death. The file: appraisal, real note terms, seed capital, and disciplined payments — substance is the whole defense.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why no capital gain on the sale?", a: "Rev. Rul. 85-13 — a sale between a grantor and their grantor trust is ignored for income tax; the same 'defect' makes the note interest non-taxable to the grantor." },
      { asker: "cpa", q: "What makes the note respected as debt?", a: "Market terms at or above the AFR, real payments actually made, seed capital (customarily ~10%) so the trust isn't buying with nothing, and no wink-wink forgiveness pattern." },
      { asker: "client", q: "What do I actually receive?", a: "A promissory note paying interest (and principal on schedule) — your balance sheet swaps growing stock for a frozen receivable, which is the point." },
      { asker: "cpa", q: "What happens if he dies with the note outstanding?", a: "The note's value is in his estate — and the open question of gain recognition at death is why trust-owned insurance sized to the balance is the standard hedge." },
      { asker: "client", q: "Why is this better than just gifting the shares?", a: "He's out of exemption — a sale moves growth without a taxable gift, and the discounts move more value per dollar of note than face math suggests." },
      { asker: "cpa", q: "How aggressive are the valuation discounts?", a: "Lack-of-control and lack-of-marketability discounts on non-voting interests are established law but audit-sensitive — a credentialed appraisal and defensible range are non-negotiable." },
      { asker: "client", q: "Who pays the trust's income tax?", a: "You do, as grantor — every tax dollar you pay is wealth the trust keeps compounding, effectively an extra transfer the gift-tax system never counts." },
      { asker: "cpa", q: "§2036 exposure?", a: "Avoided by substance: adequate seed, real note service from trust cash flow (distributions on the shares), no retained control or implied life-income arrangement." },
      { asker: "client", q: "Can the trust also buy life insurance on me?", a: "Commonly yes — it's already a grantor trust outside your estate; policy premiums can come from the business cash flow the shares throw off." },
      { asker: "cpa", q: "IDGT vs. GRAT — how do you choose?", a: "IDGT: longer horizons, GST-friendly, uses discounts, needs seed and note discipline. GRAT: statutory safe harbor, near-zero gift, but ETIP blocks GST and mortality risk is structural. Many plans run both." },
    ],
  },

  "flp-fllc-discounted-gifting": {
    category: "wealth_transfer",
    caseStudy: {
      title: "The family holding company that shrinks the taxable ruler",
      situation:
        "Parents, 63 and 61, hold $16M of rental real estate across eight LLCs, deeds and management scattered, children uninvolved. They want consolidated management, creditor insulation, and a transfer program that doesn't require selling buildings.",
      design:
        "Properties consolidate into a family LLC; parents keep the small managing interest, and begin a program of gifting non-managing interests to trusts for the children. Qualified appraisals support lack-of-control and marketability discounts on every tranche; distributions follow the operating agreement pro-rata.",
      outcome:
        "Each gifted percentage moves at a discounted gift value while management stays exactly where it was. Over a decade the program walks most of the portfolio out of the estate. The defense file — appraisals, respected formalities, no personal use of entity assets, parents keeping ample outside assets — is built from day one, because §2036 is the known battleground.",
    },
    topQuestions: [
      { asker: "cpa", q: "How do you defend the discounts?", a: "Credentialed appraisals per tranche, restrictions with real business purpose, and comparables — discounts on non-controlling interests are settled valuation law when the entity is real." },
      { asker: "cpa", q: "What is the §2036 kill shot?", a: "Retained enjoyment: parents living off entity assets, commingling, or an implied agreement they keep the income. Cured by real formalities, pro-rata distributions, and keeping personal wealth outside the entity." },
      { asker: "client", q: "Do we lose control of the buildings?", a: "No — you gift non-managing interests and retain the manager role. Control of operations and control of value transfer are deliberately separated." },
      { asker: "client", q: "Why would the IRS accept that 30% of the LLC is worth less than 30% of the buildings?", a: "Because nobody would pay full pro-rata value for an interest that can't force a sale, control distributions, or easily be sold — the discount is what a real buyer would demand." },
      { asker: "cpa", q: "Non-tax purposes on the record?", a: "Essential: consolidated management, creditor protection, succession mechanics, avoiding fractured deeds — documented in the operating agreement and minutes, not invented at audit." },
      { asker: "client", q: "How fast can we move value?", a: "Annual exclusion gifts per donee plus lifetime-exemption tranches as desired — the discount stretches every dollar of exclusion/exemption roughly a third further." },
      { asker: "cpa", q: "Basis tradeoff?", a: "Gifted interests carry over basis — no step-up. Model estate tax saved against future capital-gain cost, especially on low-basis buildings the family may someday sell." },
      { asker: "client", q: "Where does life insurance fit?", a: "An ILIT funded by gifted (discounted) interests or their distributions can hold coverage on the parents — liquidity for the estate tax on whatever remains inside." },
      { asker: "cpa", q: "Deathbed funding — how badly does that fact pattern fail?", a: "Reliably: entities formed or funded shortly before death with no operational history draw §2036 inclusion. This is a years-long program, not a January-of-death maneuver." },
      { asker: "client", q: "What do the kids actually receive today?", a: "Trust-held (or direct) non-managing interests with real distribution rights per the agreement — an ownership education program running years ahead of any control transition." },
    ],
  },

  "private-split-dollar-loan-regime": {
    category: "wealth_transfer",
    caseStudy: {
      title: "Funding trust coverage with loans instead of gifts",
      situation:
        "Couple, 59 and 57, need a $12M survivorship policy inside their ILIT, but the premium far exceeds annual exclusions and they're preserving remaining exemption for a business transfer.",
      design:
        "Loan-regime private split-dollar: the couple lends premiums to the ILIT under §7872-compliant notes at the AFR, secured by a collateral assignment of the policy. Only the modest AFR interest — not the six-figure premium — has transfer-tax significance; the trust repays from death benefit or cash value at exit.",
      outcome:
        "Full premium funding with almost no gift-tax cost, exemption preserved for the business, and a documented exit path. The file: signed notes at AFR, collateral assignment, interest actually paid or accrued and reported — loan formality IS the strategy.",
    },
    topQuestions: [
      { asker: "cpa", q: "What governs the tax treatment?", a: "The split-dollar final regulations' loan regime plus §7872 — respect the loan (AFR, documentation, repayment intent) and only the interest economics matter for gift tax." },
      { asker: "cpa", q: "Accrue or pay the interest?", a: "Either can work; paid interest keeps the balance flat, accrued interest compounds the receivable in the estate. Model both — drift is where these designs quietly go wrong." },
      { asker: "client", q: "Why loans instead of just gifting the premium?", a: "A $400K premium gift consumes exemption every year; a loan moves the same dollars with only AFR interest as the transfer-tax footprint — exemption stays available for other moves." },
      { asker: "cpa", q: "What sits in the estate at death?", a: "The note receivable (premiums advanced plus accrued interest) — the death benefit above the receivable belongs to the trust, outside the estate. The receivable itself should be part of the liquidity sizing." },
      { asker: "client", q: "How does the loan get repaid?", a: "Typically from death benefit at the second death, or earlier from policy cash value or a planned exemption gift that forgives/retires notes as part of a documented exit strategy." },
      { asker: "cpa", q: "Term of the loans — demand or fixed?", a: "Fixed-term notes lock the AFR at issue and are the common choice; demand loans float annually. Choice affects rate risk and the estate snapshot." },
      { asker: "client", q: "Is this the same as premium financing with a bank?", a: "Same skeleton, different lender: family capital replaces the bank — no underwriting covenants or rate resets, but the receivable stays on your balance sheet instead." },
      { asker: "cpa", q: "What breaks the structure?", a: "Sloppy loans: no notes, below-AFR terms, interest never handled, no exit. Then the regs treat advances as gifts (or worse), retroactively." },
      { asker: "client", q: "Can we forgive the notes later?", a: "Yes — forgiveness is a gift at that time, often the planned exit once exemption frees up. Forgive deliberately, on paper, never by silent neglect." },
      { asker: "cpa", q: "Why not economic-benefit split-dollar instead?", a: "Economic-benefit regime shines for employer arrangements or short horizons (term-cost measure); loan regime usually wins for long private funding at scale. It's a modeling decision, not a default." },
    ],
  },

  "premium-financed-life-insurance": {
    category: "wealth_transfer",
    caseStudy: {
      title: "Big coverage, borrowed premiums, banked collateral",
      situation:
        "Real-estate principal, 55, preferred health, needs $25M of ILIT-owned coverage. Writing seven-figure premium checks means liquidating appreciating projects mid-cycle — the one thing he refuses to do.",
      design:
        "A specialty lender advances annual premiums to the ILIT under a facility secured by policy cash value plus a slice of outside collateral. Interest is paid currently; the exit is modeled three ways (cash value, refinance, death benefit) at stressed rates before anyone signs.",
      outcome:
        "Full coverage in force with capital still deployed in the business. The design review runs annually — rate, collateral position, policy performance — because this is a monitored leverage strategy, not a set-and-forget purchase. When rates spiked in the model year, the stress test is what kept the case honest.",
    },
    topQuestions: [
      { asker: "cpa", q: "Is the loan interest deductible?", a: "No — policy-related interest is nondeductible under §264; the strategy is justified on opportunity cost and estate liquidity, never on an interest write-off." },
      { asker: "cpa", q: "Does the collateral assignment cause estate inclusion?", a: "Not by itself — with the ILIT as applicant/owner from inception, a lender's collateral interest isn't a grantor incident of ownership under §2042." },
      { asker: "client", q: "What's the real risk here?", a: "Interest-rate and policy-performance risk compounding: rising rates plus underperforming cash value can trigger collateral calls. The stress-tested exit model is the honest answer, and it's reviewed yearly." },
      { asker: "client", q: "Why not just pay the premiums?", a: "If your capital reliably earns more in the business than the loan costs, financing preserves that spread — that arbitrage IS the strategy; when it flips, the exit plan matters." },
      { asker: "cpa", q: "What does the exit strategy document contain?", a: "Three modeled paths (cash-value repayment, refinance, death-benefit repayment) at base and stressed rates, with trigger points for de-levering — in writing, before issue." },
      { asker: "client", q: "What happens at renewal if the bank tightens?", a: "Facilities re-price and re-collateralize periodically — refinance competition exists, but the plan can't depend on friendly renewals; hence the de-lever triggers." },
      { asker: "cpa", q: "Gift-tax footprint?", a: "Minimal by design — the lender funds premiums; gifts cover only interest and fees (if the trust doesn't). That's why large cases pick financing over exclusion-gift funding." },
      { asker: "client", q: "Who owns the policy through all this?", a: "The ILIT, from inception — the lender holds a collateral assignment, not ownership; the family's death benefit above the loan balance stays outside the estate." },
      { asker: "cpa", q: "When is this the wrong tool?", a: "Thin collateral, need for maximum early cash value, discomfort with leverage, or a case that only works at today's rates — then split-dollar or straight gifting wins." },
      { asker: "client", q: "What do you need from me every year?", a: "One design review: loan balance vs. cash value, collateral position, rate outlook, and whether to pay down. Skipping reviews is how financed cases become headlines." },
    ],
  },

  ppli: {
    category: "wealth_transfer",
    caseStudy: {
      title: "The tax-quiet wrapper for the family's alternatives sleeve",
      situation:
        "Family office principal, 51, allocates $10M across hedge strategies throwing off short-term gains taxed at 37% plus NIIT. The after-tax drag is the largest single 'fee' in the portfolio.",
      design:
        "Private placement life insurance owned by their dynasty trust: institutionally-priced variable coverage whose separate account holds insurance-dedicated funds running comparable strategies. Diversification (§817(h)) and investor-control doctrine are respected — the family picks allocations among IDFs, never directs trades.",
      outcome:
        "The alternatives sleeve compounds inside the policy without annual K-1 drag; the death benefit ultimately delivers the account non-taxable inside the exempt trust. Accredited/qualified-purchaser status, real underwriting, and non-MEC funding discipline were the gating items.",
    },
    topQuestions: [
      { asker: "cpa", q: "What keeps the IRS from looking through the wrapper?", a: "§817(h) diversification and the investor-control doctrine (Webber): the separate account holds qualifying IDFs, and the policyholder allocates among funds without directing underlying trades." },
      { asker: "cpa", q: "How is this different from retail VUL?", a: "Institutional pricing (loads measured in basis points, not percent), IDF access, and typically no surrender charges — the economics that make the wrapper cheaper than annual tax drag." },
      { asker: "client", q: "What returns does the policy earn?", a: "Whatever the chosen IDFs earn — this is genuine market exposure inside an insurance wrapper, not a fixed product; values can go down." },
      { asker: "client", q: "Can I access the money before death?", a: "Basis-first withdrawals and policy loans on a non-MEC — the reason funding is seven-pay disciplined; benefits apply while the policy remains in force." },
      { asker: "cpa", q: "MEC consequences here?", a: "A MEC flips distributions to gain-first plus a 10% pre-59½ penalty and is irrevocable (hard rule) — most PPLI designs deliberately fund just inside non-MEC limits." },
      { asker: "client", q: "Who can even buy this?", a: "Accredited investors / qualified purchasers — it's a private placement. Insurable interest and full underwriting apply like any policy." },
      { asker: "cpa", q: "Why pair it with a dynasty trust?", a: "Stacking wrappers: income-tax-quiet growth inside the policy, estate/GST-exempt ownership outside the estate — one asset, both transfer systems addressed." },
      { asker: "client", q: "What are the honest costs?", a: "COI charges, wrapper fees, IDF management fees, underwriting effort — worth it when the tax drag being eliminated is larger, which is a spreadsheet question, not a slogan." },
      { asker: "cpa", q: "State premium tax planning?", a: "Situs matters — several jurisdictions offer low premium-tax regimes for large cases; ownership situs is chosen with counsel before application." },
      { asker: "client", q: "What can't PPLI do?", a: "It can't hold your directly-managed brokerage account, your operating business, or bail out appreciated positions without a sale — it's a wrapper for new, qualifying investment allocations." },
    ],
  },
};

export const CHARITABLE_CONCEPTS: Record<string, ConceptLibraryEntry> = {
  "wealth-replacement-crt": {
    category: "charitable",
    caseStudy: {
      title: "Selling the building, paying the family AND the cause",
      situation:
        "Couple, 64 and 63, hold a $6M zero-basis commercial property under contract interest. An outright sale surrenders roughly a quarter of it to capital-gain taxes; the kids assume 'charity' means their inheritance shrinks.",
      design:
        "Before any binding sale agreement, they contribute the property to a charitable remainder unitrust. The CRT sells non-taxable, reinvests the full $6M, and pays them a lifetime unitrust income; they take a partial charitable deduction now. Part of the income stream funds an ILIT-owned survivorship policy replacing the remainder value for the children.",
      outcome:
        "Full-value reinvestment instead of an after-tax stump, lifetime income, a deduction, the charity endowed at the second death — and the kids made whole (non-taxable, estate-tax-free) by the replacement policy. Everyone's slice got bigger except the IRS's.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why does timing before the sale matter so much?", a: "Assignment-of-income doctrine: contribute after a binding sale obligation exists and the gain snaps back to the donors. The CRT must genuinely own the asset while the sale is still contingent." },
      { asker: "cpa", q: "How is the CRT's sale not taxed?", a: "The CRT is tax-exempt under §664; gain is realized inside the trust and carried out to the income beneficiaries over time under the four-tier ordering rules." },
      { asker: "client", q: "What income do we actually receive?", a: "A fixed percentage (5%+ unitrust) of the trust's value revalued annually — or a fixed annuity in the CRAT variant — for life or a term up to 20 years." },
      { asker: "cpa", q: "What are the qualification guardrails?", a: "Payout between 5% and 50%, remainder actuarially ≥10% of funded value, no self-dealing, proper administration — miss the 10% test and the trust fails at inception." },
      { asker: "client", q: "How big is the deduction?", a: "The present value of the charity's remainder under §7520 math — typically a meaningful but partial fraction of the contribution, usable against AGI limits with a five-year carryforward." },
      { asker: "client", q: "Where does the 'wealth replacement' come in?", a: "An ILIT-owned policy sized near the contributed value, funded from the CRT income — the children receive the death benefit non-taxable and outside the estate, replacing what the charity ultimately keeps." },
      { asker: "cpa", q: "How are the unitrust payments taxed to them?", a: "Four-tier ordering: ordinary income first, then capital gain, then other income, then corpus — the deferred gain typically flows out as the capital-gain tier over the years." },
      { asker: "client", q: "Can our donor-advised fund or foundation be the charity?", a: "Yes — the remainder can go to a DAF or (with stricter deduction limits) a private foundation, keeping the family's philanthropic hand on the wheel." },
      { asker: "cpa", q: "NIIT interaction?", a: "Distributed income retains character for the 3.8% NIIT — the smoothing helps some years, but model it rather than promise around it." },
      { asker: "client", q: "What if we die early?", a: "The charity's remainder accelerates — that's the actuarial bargain — while the replacement policy makes the family's side whole regardless of timing." },
    ],
  },

  "clat-wealth-replacement": {
    category: "charitable",
    caseStudy: {
      title: "Charity first, family remainder — nearly gift-tax-free",
      situation:
        "Entrepreneur, 57, post-exit, sits on $8M earmarked 'eventually for the kids' plus a standing seven-figure pledge habit. Exemption is committed elsewhere; he wants the giving he already does to also move the $8M.",
      design:
        "A 15-year zeroed-out grantor CLAT: the trust pays his chosen charities a fixed annuity satisfying his giving anyway, and whatever the assets earn above the §7520 hurdle passes to the children at a taxable-gift value of roughly zero. An upfront charitable deduction offsets a high-income year; trust-owned insurance on him hedges the recapture risk if he dies mid-term.",
      outcome:
        "The philanthropy he was doing regardless now doubles as the engine of a near-free family transfer. Grantor-trust status means he pays the CLAT's income tax (another silent transfer); the hedge policy squares the early-death scenario.",
    },
    topQuestions: [
      { asker: "cpa", q: "How does the zeroed-out math work?", a: "The charitable annuity's present value at the §7520 rate is set equal to the funding amount, so the family remainder's gift value rounds to zero — growth above the hurdle is the transfer." },
      { asker: "cpa", q: "Grantor vs. non-grantor CLAT?", a: "Grantor: upfront deduction, donor pays trust income tax, recapture risk at early death. Non-grantor: no personal deduction, trust deducts its payouts under §642(c). Choose by which tax problem is being solved." },
      { asker: "client", q: "Is there any required minimum payout like a CRT?", a: "No 5%/10% tests — CLATs are the flexible sibling; the annuity just has to be a guaranteed fixed amount actually paid." },
      { asker: "cpa", q: "What is the recapture risk?", a: "In a grantor CLAT, death during the term recaptures a slice of the upfront deduction — precisely the exposure the term-matched hedge policy is sized against." },
      { asker: "client", q: "Can payments start small and grow?", a: "Yes — escalating (shark-fin) annuities are permitted; back-loading leaves assets compounding longer, though aggressive shapes draw more scrutiny." },
      { asker: "client", q: "Who can the charity be?", a: "Public charities, DAFs, and (with self-dealing care and tighter deduction limits) the family's own foundation — the pledge habit usually maps straight in." },
      { asker: "cpa", q: "GST posture?", a: "Weak — ETIP-like uncertainty means allocation waits and is inefficient; keep grandchild goals in the dynasty bucket, children as CLAT remaindermen." },
      { asker: "client", q: "What if the assets underperform the hurdle?", a: "Charity still gets its annuity; the family remainder shrinks toward nothing. You've done the giving you intended — the transfer bonus just didn't materialize." },
      { asker: "cpa", q: "Which assets fund it best?", a: "High-expected-growth, income-producing assets that can service the annuity without forced sales; illiquid assets need a payout plan, not hope." },
      { asker: "client", q: "Why now?", a: "The lower the §7520 rate and the longer the runway, the more growth clears the hurdle for the kids — and the deduction is worth most against a high-income year like an exit." },
    ],
  },
};
