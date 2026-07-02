// Client-facing pitch narratives, one per locked-library strategy. This is
// the ONLY content the prospect deck draws from — the strategy cards
// themselves are agent-facing (they cite IRC sections, cases, and structure
// names the compliance filter rightly bans from client copy). Every string
// here is written to the docs/00 compliance language standards ("non-taxable"
// never tax-free, benefits conditioned on the policy remaining in force, no
// guarantees, no outcome quantification, no code/form/structure references)
// and every generated slide still runs through src/lib/compliance-filter.ts
// at build time — the filter is the enforcement, this file is just written
// to pass it.
//
// Adding a strategy to the library without a narrative here simply means the
// deck is unavailable for it (the UI says so) — it never invents copy.

export interface ClientPitchNarrative {
  // Client-safe display name — several library names contain structure
  // acronyms the filter bans from client copy.
  clientTitle: string;
  approach: string;
  howItWorks: string[];
  whatToKnow: string[];
  // The sell-the-improvement slide (owner directive 2026-07-02): the
  // client's CURRENT path vs. where the design leaves them, side by side.
  // Deliberately structural, never quantified — the compliance filter bans
  // dollar-figure outcome claims in client copy, and the contrast sells
  // without them. Each cell is filtered like every other deck string.
  beforeAfter: Array<{ today: string; after: string }>;
}

const FORCE = "while the policy remains in force";

const RAW_NARRATIVES: Record<string, Omit<ClientPitchNarrative, "beforeAfter">> = {
  "survivorship-second-to-die": {
    clientTitle: "Estate Liquidity at the Second Death",
    approach:
      "Much of your wealth lives in assets your family would never want to sell in a hurry. This design places a policy covering both spouses inside a trust, timed to deliver cash at the moment estate settlement costs actually arrive — after both of you have passed.",
    howItWorks: [
      "An irrevocable trust applies for and owns a policy insuring both spouses together.",
      "Because it covers two lives and pays at the second passing, coverage is typically more efficient than insuring each spouse separately.",
      "At the second passing, the trust receives the proceeds non-taxable, outside your taxable estate, and provides the cash your estate needs — so the assets you built stay in the family.",
    ],
    whatToKnow: [
      `Death benefit protection applies ${FORCE}; the design depends on keeping premiums funded.`,
      "Both spouses go through underwriting, and the trust must be set up by your attorney before the policy is issued.",
    ],
  },
  "premium-financed-life-insurance": {
    clientTitle: "Funding Significant Coverage Without Disrupting Your Capital",
    approach:
      "You need substantial protection, but writing large premium checks would mean selling assets that are working hard for you. This design uses lender financing to fund the coverage while your capital stays invested.",
    howItWorks: [
      "A trust owns the policy; a lender advances the premiums under a structured loan.",
      "Your assets serve as collateral instead of being liquidated.",
      "A defined exit plan — policy values, refinancing, or the eventual proceeds — retires the loan over time.",
    ],
    whatToKnow: [
      "Interest rates and collateral requirements are reviewed every year; this is a monitored strategy, not a set-and-forget one.",
      `Coverage applies ${FORCE}, and the lending arrangement has its own approval process alongside underwriting.`,
    ],
  },
  "estate-funding": {
    clientTitle: "Cash for Your Estate, Exactly When the Bill Arrives",
    approach:
      "For some families the estate settlement bill arrives at the first passing, not the second — and the estate is rich in property but short on cash. This design puts a policy on your life inside a trust so the money shows up on the same day the obligation does.",
    howItWorks: [
      "An irrevocable trust applies for and owns a policy on your life from the very start.",
      "You make annual gifts to the trust that keep the coverage funded.",
      "At your passing, the trust receives the proceeds non-taxable and outside your estate, then provides your estate the liquidity it needs — no forced sales, no fire-sale prices.",
    ],
    whatToKnow: [
      `The death benefit applies ${FORCE}.`,
      "Your attorney drafts the trust first; the trust — not you — applies for the coverage, which is what keeps the proceeds outside your estate.",
    ],
  },
  grats: {
    clientTitle: "Passing Future Growth to Your Family, Not Your Estate",
    approach:
      "When you own something you expect to grow quickly, the growth itself can be moved to your children at little or no gift cost. You place the asset in a trust for a set term, the trust pays you back what you put in plus a modest return, and the growth above that passes to your family.",
    howItWorks: [
      "You transfer the appreciating asset into a trust with a short, fixed term.",
      "The trust pays you an annual amount that returns your principal plus a benchmark rate.",
      "Whatever the asset earns above the benchmark passes to your family — and a life insurance policy alongside the trust protects the plan if you don't survive the term.",
    ],
    whatToKnow: [
      "If you pass away during the term, the asset comes back into your estate — that's exactly the risk the paired coverage is designed to absorb.",
      `The hedge policy's protection applies ${FORCE}, and your attorney structures the trust itself.`,
    ],
  },
  "quiet-wealth-transfer": {
    clientTitle: "Turning Retirement Funds Into a Family Legacy",
    approach:
      "Retirement accounts are among the hardest assets to leave behind — your heirs are required to draw them down quickly, at their own tax rates, often in their peak earning years. This design converts that future tax problem into a legacy your family receives non-taxable.",
    howItWorks: [
      "Your retirement funds purchase an income annuity that pays you for life and satisfies your required distributions automatically.",
      "You pay tax on those payments at your rates — typically lower than your children's.",
      "The after-tax income makes annual gifts to a trust, and the trust owns a life policy from day one; at your passing your family receives the proceeds non-taxable, outside your estate.",
    ],
    whatToKnow: [
      `The death benefit applies ${FORCE}; the annuity income is taxable to you as received.`,
      "This works when the retirement money is legacy money — funds you don't need for your own lifestyle.",
    ],
  },
  "rmd-repositioning": {
    clientTitle: "Putting Required Withdrawals to Work for Your Family",
    approach:
      "The government already requires you to take money out of your retirement accounts each year and pay the tax — whether you need it or not. Instead of letting those withdrawals pile up in a taxable account, this design redirects them into a legacy your family receives non-taxable.",
    howItWorks: [
      "Your required annual withdrawals happen as they already must — no new tax is created.",
      "The after-tax amount funds annual gifts to a trust that owns a life policy on your life from the start.",
      "Each year's forced withdrawal converts into death benefit protection outside your taxable estate.",
    ],
    whatToKnow: [
      `The death benefit applies ${FORCE}.`,
      "The design fits when your required withdrawals exceed what you spend — it repositions money already in motion.",
    ],
  },
  "roth-plus-life": {
    clientTitle: "Pre-Paying Tomorrow's Tax at Today's Rates",
    approach:
      "Converting retirement funds to the after-tax kind means paying income tax now so your heirs inherit accounts they can draw non-taxable. Pairing the conversions with life insurance restores to your family the tax you pre-paid.",
    howItWorks: [
      "Conversions are staged over several years, each sized to stay inside your current tax bracket.",
      "The converted accounts grow without required lifetime withdrawals and pass to your heirs non-taxable under the rules for inherited accounts.",
      "A life policy sized to the taxes you pre-paid makes your family whole — they receive both the converted accounts and the death benefit.",
    ],
    whatToKnow: [
      "Conversions cannot be undone once made, which is why staging and bracket discipline matter.",
      `The death benefit applies ${FORCE}; conversion taxes are ideally paid from funds outside the retirement account.`,
    ],
  },
  "annuity-rescue": {
    clientTitle: "Putting an Old Annuity Back to Work",
    approach:
      "An annuity bought years ago may no longer fit — high costs, features you never use, or a large built-up gain you don't intend to spend. The tax code allows that value to move, without triggering the gain, into something that matches what you actually want now.",
    howItWorks: [
      "We diagnose the existing contract first: costs, surrender schedule, and the size of the built-up gain.",
      "If growth is the goal, the value moves directly into a stronger contract, keeping its tax deferral.",
      "If long-term care is the concern, the value can move into a design where that built-up gain pays for care benefits non-taxable; if legacy is the goal, lifetime income from the contract can fund a trust-owned life policy.",
    ],
    whatToKnow: [
      "The move must be a direct transfer between insurance companies — cashing out first would trigger the tax.",
      `Any life or care benefits in the new design apply ${FORCE}; surrender charges on the old contract are always weighed first.`,
    ],
  },
  "qualified-ltc": {
    clientTitle: "Funding Long-Term Care with Money You Already Have",
    approach:
      "A long care event is the risk that can unwind every other plan — forcing the exact asset sales your family wanted to avoid. This design repositions money you already hold so that care, if you ever need it, is paid with benefits you receive non-taxable.",
    howItWorks: [
      "An old annuity with built-up gain can move directly into a care-focused design — the gain that would have been taxed instead pays for care benefits non-taxable.",
      "Retirement funds can do the same job through a schedule of withdrawals that spreads the tax.",
      "If care is never needed, these designs return value to your family rather than being use-it-or-lose-it.",
    ],
    whatToKnow: [
      `Care and death benefits apply ${FORCE}; benefit levels, waiting periods, and inflation options are chosen at design time.`,
      "Each spouse's retirement account can fund coverage for that spouse only — joint coverage comes from other money, and we design around that rule.",
    ],
  },
  "ilit-foundation-wrapper": {
    clientTitle: "Keeping Life Insurance Outside Your Taxable Estate",
    approach:
      "A policy you own personally is counted in your estate — which can mean the very coverage you bought to pay estate costs makes the estate bigger. Owning it inside an irrevocable trust keeps the proceeds out.",
    howItWorks: [
      "Your attorney creates an irrevocable trust; the trust applies for and owns the policy from the beginning.",
      "You make annual gifts to the trust, and the trustee pays the premiums.",
      "At your passing, the trust receives the proceeds non-taxable and entirely outside your estate, then uses them exactly as your trust document directs.",
    ],
    whatToKnow: [
      `The death benefit applies ${FORCE}.`,
      "The trust must own the policy from day one — moving an existing policy in brings a three-year waiting period the design avoids by starting fresh.",
    ],
  },
  slat: {
    clientTitle: "Using Today's Exemption Without Losing Every Benefit",
    approach:
      "Today's historically high gift exemption lets you move substantial wealth out of your estate — but most couples hesitate to give assets fully away. This design gifts to a trust that benefits your spouse, so the household keeps indirect access while the gift, and all its growth, leaves the estate.",
    howItWorks: [
      "One spouse creates an irrevocable trust benefiting the other spouse and, typically, your children.",
      "A gift using your lifetime exemption funds the trust; the trust can then own a substantial life policy.",
      "Growth on everything inside the trust — including any eventual insurance proceeds, received non-taxable — happens outside both spouses' estates.",
    ],
    whatToKnow: [
      "Access runs through the beneficiary spouse, so the plan is stress-tested for divorce or an early passing before it's signed.",
      `Any policy inside the trust provides protection ${FORCE}; your attorney tailors the trust terms.`,
    ],
  },
  "dynasty-gst-trust": {
    clientTitle: "Wealth That Skips the Tax Line for Generations",
    approach:
      "Ordinarily, wealth is taxed as it passes to each generation — your children, then again to theirs. A generation-spanning trust, funded during your lifetime, lets what you set aside grow and benefit grandchildren and beyond without re-taxation at each step.",
    howItWorks: [
      "Your attorney establishes a long-duration trust in a state that permits it.",
      "You allocate your generation-skipping exemption to the trust when you fund it — an allocation that must be made deliberately, or it's lost.",
      "Life insurance inside the trust multiplies what each gifted dollar delivers, with proceeds received non-taxable for the benefit of generations.",
    ],
    whatToKnow: [
      "The generation-skipping exemption does not transfer automatically between spouses — using it requires affirmative planning.",
      `Policy benefits apply ${FORCE}; trust duration and state selection are attorney decisions.`,
    ],
  },
  "private-split-dollar-loan-regime": {
    clientTitle: "Lending the Premiums Instead of Gifting Them",
    approach:
      "Funding a very large policy by gift can consume a lot of exemption. Structured as a family loan instead, the premium dollars are advanced to the trust and come back to you later — so exemption is preserved for other assets.",
    howItWorks: [
      "You lend premium dollars to the trust that owns the policy, documented like any proper loan with interest at the government's published minimum rate.",
      "The trust owns the coverage; your loan is secured by the policy.",
      "At your passing or at an agreed point, the loan is repaid — and the balance of the proceeds stays in the trust, received non-taxable, for your family.",
    ],
    whatToKnow: [
      "The note, interest, and repayment mechanics are real obligations that must be respected for the design to hold.",
      `Coverage applies ${FORCE}; your attorney and tax advisor document the loan.`,
    ],
  },
  "installment-sale-idgt": {
    clientTitle: "Freezing Today's Value, Moving Tomorrow's Growth",
    approach:
      "If your business or investment assets are still climbing, every year of growth adds to your future estate. Selling the asset to a family trust in exchange for a note freezes what your estate holds at today's value — all future growth accrues to your family instead.",
    howItWorks: [
      "Your attorney creates a trust treated, for income tax purposes, as you — so selling to it triggers no capital gain.",
      "You seed the trust with a gift, then sell the appreciating asset to it for an installment note at the government minimum rate.",
      "The trust's growing cash flow can fund substantial life insurance without further gifts, and everything above the note rate compounds outside your estate.",
    ],
    whatToKnow: [
      "An independent appraisal supports the sale price; the note payments are real and must be made.",
      `Any policy the trust funds applies ${FORCE}; this is an attorney-led structure with insurance inside it.`,
    ],
  },
  "wealth-replacement-crt": {
    clientTitle: "Income From an Appreciated Asset, a Gift to Charity, and an Inheritance Intact",
    approach:
      "A low-cost-basis asset you've held for years carries a heavy tax if you sell it yourself. Contributing it to a charitable trust lets it be sold without immediate capital gains, pays you an income for life, earns a current deduction — and life insurance replaces for your children what ultimately goes to charity.",
    howItWorks: [
      "You contribute the appreciated asset to a charitable trust, which sells it without immediate tax and reinvests the full proceeds.",
      "The trust pays you an income stream for life, and you receive a partial charitable deduction now.",
      "Part of that income funds a family trust that owns a life policy — at your passing your children receive proceeds non-taxable, replacing the value passing to charity.",
    ],
    whatToKnow: [
      `The replacement policy applies ${FORCE}; the income stream is taxed as received under the trust's accounting rules.`,
      "The charitable gift is irrevocable — this design is for genuine charitable intent, with the family made whole alongside it.",
    ],
  },
  "flp-fllc-discounted-gifting": {
    clientTitle: "Transferring the Family Enterprise While Keeping the Keys",
    approach:
      "You want your business or property portfolio moving to the next generation without giving up control of how it's run. Consolidating the assets in a family entity lets you gift minority interests — valued at a documented discount — while you keep the management reins.",
    howItWorks: [
      "The family's business or real estate is contributed to a family entity; you retain the controlling interest.",
      "Appraised minority interests are gifted or sold to a family trust at their discounted value, stretching your exemption further.",
      "The entity's distributions to the trust fund a life policy, adding proceeds received non-taxable to what passes outside your estate.",
    ],
    whatToKnow: [
      "The entity must have a genuine business purpose and be run with real formalities — this is a structure you operate, not just sign.",
      `Coverage funded through the trust applies ${FORCE}; independent appraisal supports every discount.`,
    ],
  },
  "section-162-executive-bonus-reba": {
    clientTitle: "Rewarding Your Key Executive with a Benefit They Own",
    approach:
      "You want your best people to stay, and you want the reward to feel personal — not another line in a group plan. The company pays a deductible bonus that funds a permanent life policy the executive owns, with strings you design.",
    howItWorks: [
      "The company pays an annual bonus, deductible as compensation, which the executive uses to fund a personally-owned policy.",
      "The policy builds value the executive can use later, and its death benefit protects their family.",
      "A restrictive agreement limits the executive's access to the policy's value until your vesting terms are met — the retention handle.",
    ],
    whatToKnow: [
      "The bonus is taxable income to the executive (often the company grosses it up), and it must be reasonable compensation for the role.",
      `Policy benefits apply ${FORCE}; the vesting agreement is drafted to your specifications.`,
    ],
  },
  "buy-sell-life-insurance": {
    clientTitle: "A Funded Exit for Every Owner, at a Price Set in Advance",
    approach:
      "When one owner of a business passes away, two families need opposite things at the same moment: the survivors need the ownership, and the family needs the money. A funded buy-sell agreement settles both in advance — the price, the buyer, and the cash.",
    howItWorks: [
      "Your attorney documents who buys, at what price or formula, on death or disability.",
      "Life insurance on each owner funds the purchase, so the money exists the day it's needed.",
      "A recent Supreme Court decision changed which ownership design is safest for taxes — existing agreements deserve a fresh review, and new ones are structured with that ruling in mind.",
    ],
    whatToKnow: [
      "The agreement's valuation should be revisited regularly so the coverage still matches the price.",
      `Funding applies ${FORCE}; how the policies are owned — by the owners, the company, or a special entity — is the design decision we get right up front.`,
    ],
  },
  "key-person-life-insurance": {
    clientTitle: "Protecting the Business Against the Loss of Its Most Valuable People",
    approach:
      "Some people are worth more to the business than any machine on the floor — a rainmaker, a founder, the one person who holds the lender relationships. This coverage gives the company cash to absorb the loss, recruit, and reassure creditors.",
    howItWorks: [
      "The company applies for, owns, and is the beneficiary of a policy on the key person — with the person's written consent, obtained before the policy is issued.",
      "Coverage is sized to what the person actually contributes: a multiple of compensation or their share of earnings.",
      "If the design uses permanent coverage, the policy's value sits on the company's books as an asset.",
    ],
    whatToKnow: [
      "The consent paperwork and annual reporting are formalities that must be done correctly for the proceeds to arrive non-taxable to the company.",
      `Coverage applies ${FORCE}, and it can later be repurposed as a retention benefit for the same person.`,
    ],
  },
  "coli-corporate-reserve": {
    clientTitle: "A Tax-Advantaged Reserve on the Company's Balance Sheet",
    approach:
      "Profitable companies accumulate reserves — and usually park them where every dollar of growth is taxed every year. Company-owned permanent life insurance turns that reserve into an asset that grows without annual tax and stands ready to fund whatever comes next.",
    howItWorks: [
      "The company owns permanent policies on owners or key people, funded from retained earnings with each insured's advance written consent.",
      "Policy value grows without current tax and is accessible to the company along the way.",
      "The reserve informally backs the company's promises — succession funding, key-person exposure, executive benefits — and the eventual proceeds recover the cost.",
    ],
    whatToKnow: [
      `Cash value access and death benefits apply ${FORCE}; funding is engineered to stay inside the tax code's design limits, which are permanent once crossed.`,
      "Your accountant is part of the design — entity type changes how the reserve interacts with the company's books.",
    ],
  },
  "nqdc-serp-coli": {
    clientTitle: "A Retirement Promise That Handcuffs Kindly",
    approach:
      "Qualified plans cap what you can do for your most important people — and for yourself. A private, contractual retirement promise pays your key executive meaningful income later, on a vesting schedule you set, informally backed by company-owned insurance.",
    howItWorks: [
      "The company adopts a written agreement promising defined retirement payments, with vesting tied to tenure or performance.",
      "Company-owned permanent insurance on the executive is sized so its value tracks the promise — and recovers the full cost at the end.",
      "Benefit payments are deductible to the company when paid; the executive is taxed only as payments are received.",
    ],
    whatToKnow: [
      "The rules governing deferred compensation are strict about timing and cannot be papered over later — the agreement is drafted once, correctly.",
      `The backing policy applies ${FORCE}; the promise itself remains a company obligation, which is what keeps it tax-deferred for the executive.`,
    ],
  },
  "endorsement-split-dollar": {
    clientTitle: "Millions of Protection for Your Executive, at a Fraction of the Cost",
    approach:
      "You want a key executive's family protected — but you also want the company to keep the asset and get its money back. The company owns the policy and shares just the protection with the executive, who pays tax only on the small annual value of that coverage.",
    howItWorks: [
      "The company owns and funds a permanent policy on the executive, with the executive's advance written consent.",
      "A written endorsement directs part of the death benefit to the executive's family.",
      "The executive's only cost is tax on the modest annual value of the protection; the company keeps the policy's cash value and recovers its outlay.",
    ],
    whatToKnow: [
      `The endorsed protection applies ${FORCE} and lasts as long as the agreement does — which is exactly the retention handle.`,
      "At retirement the arrangement can end with the company keeping everything, or the policy can be rolled out to the executive as a final reward — a taxable event that's planned in advance.",
    ],
  },
  "qprt-insurance-hedge": {
    clientTitle: "Passing the Family Home at a Discount",
    approach:
      "Your home may be one of the largest assets in your estate — and the one your family most wants to keep. A residence trust lets you give the home's future value away at a steep discount while you keep living in it for a term you choose.",
    howItWorks: [
      "You transfer the residence to a trust and retain the right to live there for a fixed period.",
      "The taxable gift is only a fraction of today's value, because you kept the right to use it.",
      "Outlive the term and the home — plus all its appreciation — is out of your estate; a life policy in a separate trust protects the plan if you don't.",
    ],
    whatToKnow: [
      "After the term you rent the home from the trust at market rates — which quietly moves even more to your family.",
      `The hedge policy applies ${FORCE}; your attorney weighs the trade-offs, including how the home's cost basis carries over to your heirs.`,
    ],
  },
  ppli: {
    clientTitle: "An Institutional Insurance Wrapper for Tax-Heavy Investments",
    approach:
      "Some of the best-performing investments are also the worst-taxed — strategies that generate ordinary income year after year. For substantial investors, an institutionally-priced insurance wrapper lets those strategies compound without the annual tax drag, and pass to your family non-taxable.",
    howItWorks: [
      "A policy built for large cases — minimal loads, institutional pricing — is typically owned by your family trust.",
      "Premiums allocate among insurance-dedicated funds mirroring the strategies you already favor; growth inside is non-taxable while the policy remains in force.",
      "You may choose among the available funds but never direct the underlying trades — that bright line is what preserves the tax treatment.",
    ],
    whatToKnow: [
      "Congress has proposed legislation aimed at this design; it is not law today, but the plan is built to current rules and reviewed as the landscape moves.",
      "Access along the way comes through withdrawals and loans against the policy, planned so the design stays intact.",
    ],
  },
  "clat-wealth-replacement": {
    clientTitle: "A Big Deduction Year, a Legacy for Charity, and the Remainder to Family",
    approach:
      "In a spike-income year — a business sale, an outsized bonus — a lead trust gives charity a fixed annual gift for a term of years, earns you a substantial deduction now, and passes whatever the trust earns above its benchmark to your children at little or no gift cost.",
    howItWorks: [
      "You fund the trust in the high-income year; it pays your chosen charity a fixed amount each year of the term.",
      "You take the deduction for the charity's stream up front, when your tax rate is highest.",
      "At the term's end the remainder passes to your family — and a separate trust-owned life policy makes sure their inheritance doesn't depend on markets beating the benchmark.",
    ],
    whatToKnow: [
      "In the deduction version you also pick up the trust's taxable income in later years — a trade your tax advisor prices before you sign.",
      `The replacement policy applies ${FORCE}; the charity's payments are fixed obligations of the trust.`,
    ],
  },
  "family-income-legacy": {
    clientTitle: "If Your Income Stopped Tomorrow, Their Plans Shouldn't",
    approach:
      "Your family's real risk isn't estate tax — it's that the mortgage, the groceries, and the college plans all depend on a paycheck. This design replaces that income if you're gone, at a cost built to fit the budget that exists today.",
    howItWorks: [
      "We total what actually needs protecting: the debts, the income years until the kids are independent, the mortgage balance, education.",
      "Layers of term coverage match each need's timeline, so protection steps down as the mortgage shrinks and the kids grow up — and so does the cost.",
      "A modest permanent policy underneath covers final expenses and leaves a legacy no matter how long you live, and every term layer can convert to permanent coverage later without new medical questions.",
    ],
    whatToKnow: [
      `Proceeds arrive to your family non-taxable, and protection applies ${FORCE}.`,
      "How beneficiaries are named — especially for minor children — matters as much as the amount; we set that up correctly from the start.",
    ],
  },
};

// The before/after rows, per strategy. "today" = the client's current path;
// "after" = where the design leaves them. Structural contrast only — the
// improvement is shown, never promised in dollars.
const BEFORE_AFTER: Record<string, ClientPitchNarrative["beforeAfter"]> = {
  "survivorship-second-to-die": [
    {
      today:
        "Estate settlement costs at the second passing get paid by selling property or business interests — at whatever price a deadline allows.",
      after:
        "The trust delivers cash at exactly that moment, non-taxable and outside the estate — the assets stay in the family.",
    },
    {
      today: "Two separate policies would cost more for the same protection.",
      after:
        "One policy covering both lives, priced on joint life expectancy, typically protects more per premium dollar.",
    },
  ],
  "premium-financed-life-insurance": [
    {
      today:
        "Funding major coverage means liquidating investments — and paying tax on the way out.",
      after:
        "Your capital stays invested; a lender funds the premiums against collateral, with a planned exit.",
    },
    {
      today: "Large annual gifts would consume exemption you may want for other assets.",
      after: "Financing preserves your exemption for the rest of the plan.",
    },
  ],
  "estate-funding": [
    {
      today:
        "The estate bill can arrive at the first passing while the estate is property-rich and cash-poor — a forced sale sets the price.",
      after: "Cash arrives the same day the obligation does — non-taxable, from outside the estate.",
    },
    {
      today: "Coverage you own personally makes the taxable estate bigger.",
      after: "Trust ownership from day one keeps it out entirely.",
    },
  ],
  grats: [
    {
      today: "The asset's future growth compounds inside your estate, growing tomorrow's tax bill.",
      after: "Growth above a benchmark passes to your family at little or no gift cost.",
    },
    {
      today: "An outright gift of the asset would consume a large slice of exemption now.",
      after: "You get your principal back plus a return — mostly the upside moves.",
    },
  ],
  "quiet-wealth-transfer": [
    {
      today:
        "Your heirs must empty the inherited retirement account within ten years, taxed at their own peak rates.",
      after:
        "The account converts — over your lifetime, at your rates — into value your family receives non-taxable, outside the estate.",
    },
    {
      today: "Required withdrawals pile up in a taxable account with no plan.",
      after: "Every after-tax dollar has a destination and a multiplier.",
    },
  ],
  "rmd-repositioning": [
    {
      today:
        "Forced withdrawals you don't spend land in a taxable account — taxed going in, taxed as they grow, counted in the estate at the end.",
      after:
        "The same withdrawals fund protection your family receives non-taxable, outside the estate.",
    },
  ],
  "roth-plus-life": [
    {
      today:
        "Heirs inherit a pre-tax account and pay the tax at their own rates on a ten-year clock.",
      after:
        "Heirs inherit an account they draw non-taxable — and the coverage restores what you pre-paid to get there.",
    },
    {
      today: "Future required withdrawals push your own bracket up in later years.",
      after: "Converted funds have no required lifetime withdrawals at all.",
    },
  ],
  "annuity-rescue": [
    {
      today:
        "An old contract charges yesterday's costs for features you no longer use — with a locked-up gain you'd be taxed to touch.",
      after:
        "The value moves — gain intact and untriggered — into a design matched to what you actually want now.",
    },
  ],
  "qualified-ltc": [
    {
      today:
        "A long care event is self-insured: paid from savings, after tax, possibly by selling assets at the worst time.",
      after:
        "Care, if ever needed, is paid with benefits received non-taxable; if never needed, value returns to the family.",
    },
    {
      today: "The gain in an old annuity becomes ordinary income the day you touch it.",
      after: "That same gain can pay for care without ever appearing on your return.",
    },
  ],
  "ilit-foundation-wrapper": [
    {
      today:
        "Personally-owned coverage counts in the taxable estate — shrinking the very thing it was bought to protect.",
      after:
        "Trust-owned from day one, it stays entirely outside — every dollar arrives where you aimed it.",
    },
  ],
  slat: [
    {
      today: "Using the exemption feels like a one-way door — assets fully given away.",
      after:
        "The gift leaves both estates, but the household keeps indirect access through your spouse.",
    },
    {
      today: "Waiting risks planning around a smaller exemption if the law changes again.",
      after:
        "Today's exemption is locked in on the assets — and their growth — the day the trust is funded.",
    },
  ],
  "dynasty-gst-trust": [
    {
      today: "Wealth is re-taxed at every generation it passes through.",
      after:
        "What you set aside benefits children, grandchildren, and beyond without the repeat toll.",
    },
  ],
  "private-split-dollar-loan-regime": [
    {
      today: "Funding a large trust-owned policy by gift consumes exemption every single year.",
      after:
        "Premiums are advanced as a documented loan and come back — exemption stays for other assets.",
    },
  ],
  "installment-sale-idgt": [
    {
      today: "A growing business compounds inside your estate at full throttle.",
      after:
        "Today's value is frozen at a note; the growth curve belongs to your family's trust.",
    },
  ],
  "wealth-replacement-crt": [
    {
      today:
        "Selling the appreciated asset yourself triggers the capital-gains tax immediately, shrinking what's left to reinvest.",
      after:
        "The trust sells without immediate tax, pays you for life, and the family's inheritance is replaced alongside the charitable gift.",
    },
  ],
  "flp-fllc-discounted-gifting": [
    {
      today:
        "Gifting the business or property outright transfers it dollar-for-dollar against your exemption — and hands over the keys.",
      after:
        "Appraised minority interests move at a documented discount while you keep management control.",
    },
  ],
  "section-162-executive-bonus-reba": [
    {
      today:
        "Extra cash compensation is taxed and spent — nothing ties your best people to the firm.",
      after:
        "The bonus builds an asset the executive owns but can't fully touch until your vesting terms are met.",
    },
  ],
  "buy-sell-life-insurance": [
    {
      today:
        "At an owner's death, the price, the buyer, and the money are all open questions — negotiated under grief and deadline.",
      after: "All three are settled in advance, and the funding exists the day it's needed.",
    },
    {
      today: "An unfunded agreement is an IOU the survivors may have to borrow against.",
      after: "Coverage turns the promise into cash.",
    },
  ],
  "key-person-life-insurance": [
    {
      today:
        "Losing the rainmaker means lost revenue, nervous lenders, and an unfunded search for a replacement.",
      after: "The company holds cash to absorb the hit, reassure creditors, and recruit.",
    },
  ],
  "coli-corporate-reserve": [
    {
      today: "Retained earnings sit in instruments taxed every single year.",
      after:
        "The reserve compounds without annual tax while the policy remains in force — and stands behind succession, key-person, and benefit promises.",
    },
  ],
  "nqdc-serp-coli": [
    {
      today:
        "Qualified-plan caps limit what you can promise your most important executive — anything extra is just taxable salary.",
      after:
        "A vested promise pays meaningful retirement income later, and the company recovers its full cost.",
    },
  ],
  "endorsement-split-dollar": [
    {
      today: "Personal coverage at this scale would cost the executive real after-tax money.",
      after:
        "The company funds it; the executive is taxed only on a small annual amount for the protection.",
    },
    {
      today: "A plain bonus walks out the door with the employee.",
      after: "The company keeps the asset until your terms are met.",
    },
  ],
  "qprt-insurance-hedge": [
    {
      today: "The home — and every year of its appreciation — sits fully inside the taxable estate.",
      after:
        "The home passes at a fraction of today's value in gift terms; you keep living in it through the term.",
    },
  ],
  ppli: [
    {
      today:
        "The portfolio's ordinary income is taxed at top rates every year — compounding for the government first.",
      after:
        "The same strategies compound without annual tax while the policy remains in force, and pass to your family non-taxable.",
    },
  ],
  "clat-wealth-replacement": [
    {
      today: "A spike-income year is taxed at the top bracket with nothing to show for it.",
      after:
        "A front-loaded deduction lands in your highest-rate year, charity receives a fixed stream, and the remainder reaches your family at little or no gift cost.",
    },
  ],
  "family-income-legacy": [
    {
      today: "The mortgage, the groceries, and the college plans all rest on next month's paycheck.",
      after:
        "If the paycheck stops, the plan doesn't — coverage steps in, sized to the actual liabilities and stepping down as they shrink.",
    },
  ],
};

export const CLIENT_PITCH: Record<string, ClientPitchNarrative> = Object.fromEntries(
  Object.entries(RAW_NARRATIVES).map(([slug, narrative]) => [
    slug,
    { ...narrative, beforeAfter: BEFORE_AFTER[slug] ?? [] },
  ]),
);
