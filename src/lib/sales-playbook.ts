// The field-sales layer of the Brain (docs/31-sales-playbook.md, owner-
// supplied playbook ingested 2026-07-07): per strategy — the hook, compliant
// positioning, the pitch, objections with responses, cross-sell, and the COI
// to involve. Renders as the "Field playbook" section on Library concept
// pages. Agent-facing talk tracks: the compliance standards are written in
// (non-taxable, while-in-force conditioning, no form numbers in client copy),
// and anything GENERATED for a client still passes the compliance filter.
// docs/31 is the source of truth — edit there, mirror here.

export interface PlaybookObjection {
  objection: string;
  response: string;
}

export interface FieldPlaybookEntry {
  whatItIs: string;
  idealClient: string;
  hook: string;
  positioning: string;
  pitch: string;
  objections: PlaybookObjection[];
  crossSell: string[];
  coi: string;
}

export const SALES_PLAYBOOK: Record<string, FieldPlaybookEntry> = {
  "coli-corporate-reserve": {
    whatItIs:
      "Company-owned life insurance on owners/key people; cash value builds a non-taxable corporate reserve while the policy remains in force.",
    idealClient: "C-Corp / profitable business with retained earnings sitting in low-yield accounts.",
    hook: "Turn idle retained earnings into a tax-advantaged reserve that also protects the business if a key person is lost.",
    positioning:
      "Position as a balance-sheet asset and key-person protection, not a product sale. Non-taxable growth while the policy remains in force.",
    pitch:
      "You're holding cash earning almost nothing and fully taxable. We can reposition a portion into a corporate reserve that grows without current tax, stays accessible to the business, and pays the company if you lose a key person.",
    objections: [
      {
        objection: "We don't have extra cash.",
        response: "It's a reposition, not new money — we move a slice of what's already sitting idle.",
      },
      {
        objection: "Why not just invest it?",
        response:
          "This layer is non-correlated, non-taxable while in force, and adds death-benefit protection an investment account can't.",
      },
    ],
    crossSell: ["§162/REBA for the same key employees", "Buy-Sell funding"],
    coi: "CPA on §101(j) notice-and-consent (required before issue) and balance-sheet treatment.",
  },

  "section-162-executive-bonus-reba": {
    whatItIs:
      "Employer bonuses fund a personally-owned permanent policy for a key employee; REBA adds a vesting restriction (golden handcuffs).",
    idealClient:
      "Business owner wanting to retain/reward key people without ERISA or qualified-plan complexity.",
    hook: "Reward your best people with a benefit they can see and feel, and tie them to you with a vesting schedule.",
    positioning:
      "Frame as coordinated, tax-efficient compensation. Employer deduction under reasonable-comp rules; employee owns the policy.",
    pitch:
      "You want to keep your top producer. We bonus the premium on a policy they own, add a vesting restriction so it rewards them for staying, and the business deducts it as compensation.",
    objections: [
      {
        objection: "It's taxable to the employee.",
        response: "Yes — we gross up the bonus so the benefit is net-neutral to them and still deductible to you.",
      },
      {
        objection: "What stops them leaving?",
        response: "The restrictive endorsement — they don't get full access to cash value until they vest.",
      },
    ],
    crossSell: ["Corporate Reserve Fund", "Phantom stock as a second retention layer"],
    coi: "CPA on reasonable-compensation support and deductibility.",
  },

  "quiet-wealth-transfer": {
    whatItIs:
      "Reposition an annuity/IRA through a SPIA that pays annual income; after-tax income funds a life policy inside an ILIT, moving wealth to heirs non-taxable while in force.",
    idealClient:
      "Qualified-fund-heavy pre-retiree with money they don't need for income, wanting to leave more to heirs.",
    hook: "Convert a taxable, RMD-burdened account into a larger, non-taxable legacy for the family.",
    positioning:
      "Diagnosis-first, structurally efficient transfer. Never name the underlying mechanics or form numbers in client copy. Non-taxable to heirs while the policy remains in force.",
    pitch:
      "This account is going to hit your heirs with a tax bill on a compressed timeline. We can reposition it so it delivers a larger, non-taxable benefit to the family instead.",
    objections: [
      {
        objection: "I might need that money.",
        response: "Then it's not a candidate — this is only for dollars you've earmarked for heirs.",
      },
      {
        objection: "Taxes on the conversion?",
        response:
          "Handled with a bridge that spreads it; your advisor models the net — we only proceed if the family comes out ahead.",
      },
    ],
    crossSell: ["Inheritance Tax Trap diagnostic", "Survivorship for married couples"],
    coi: "CPA/attorney on the ILIT (original-owner requirement, §2035 timing) and tax modeling.",
  },

  "survivorship-second-to-die": {
    whatItIs:
      "Second-to-die policy in an ILIT provides non-taxable liquidity at the second death, when estate tax is actually due.",
    idealClient: "Married couple with an illiquid taxable estate (real estate, business, collectibles).",
    hook: "Pay the estate tax bill with discounted dollars instead of forcing a fire-sale of the business or property.",
    positioning:
      "Liquidity timed to the taxable event. Lower cost per benefit dollar than two single-life policies. Non-taxable while in force and held outside the estate.",
    pitch:
      "Your estate is rich but cash-poor. At the second death the IRS wants cash your heirs would have to raise by selling assets. Survivorship life delivers that cash, non-taxable, at a fraction of the cost.",
    objections: [
      {
        objection: "Exemptions are high now.",
        response:
          "They can change, and even under today's rules your overage is exposed — this sizes to the actual projected bill.",
      },
      {
        objection: "We're both getting older.",
        response: "Joint mortality pricing usually still beats two single policies — we illustrate both.",
      },
    ],
    crossSell: ["ILIT wrapper (always)", "Dynasty/GST allocation for grandchildren"],
    coi: "Estate attorney on the ILIT and Crummey process; CPA on projected estate tax.",
  },

  "qualified-ltc": {
    whatItIs:
      "Reposition qualified or non-qualified dollars into a life/LTC or annuity/LTC vehicle providing non-taxable LTC benefits while in force.",
    idealClient: "Pre-retiree worried about long-term-care cost eroding the estate.",
    hook: "Cover a care event without the use-it-or-lose-it problem of traditional LTC.",
    positioning:
      "Frame as protecting the family's assets from a care event. Individually-owned IRA required; a spouse's IRA cannot fund joint LTC benefits (hard rule 8).",
    pitch:
      "A long care event is the single biggest threat to your retirement assets. We can reposition idle dollars into a vehicle that pays for care non-taxable — and pays your heirs if you never need it.",
    objections: [
      {
        objection: "I might never use it.",
        response:
          "Unlike old LTC, if you don't use it the death benefit goes to your family — the money isn't lost.",
      },
      {
        objection: "It's expensive.",
        response: "We reposition existing assets rather than adding a new premium out of cash flow.",
      },
    ],
    crossSell: ["Estate Funding", "Survivorship for couples"],
    coi: "CPA on IRA ownership rules (individual ownership; no joint-benefit funding).",
  },

  "rmd-repositioning": {
    whatItIs:
      "The Inheritance Tax Trap diagnostic: show how one forced RMD cascades into multiple taxes and a compressed payout clock for heirs — then reposition.",
    idealClient: "Qualified-fund-heavy client who assumes their IRA passes cleanly to the kids.",
    hook: "Show the client the hidden tax cascade sitting inside their retirement account — then solve it.",
    positioning:
      "Diagnosis is the close. Educate first, then present repositioning. No form numbers or structure names in client copy.",
    pitch:
      "Most people think their IRA goes to the kids intact. Let me show you the cascade of taxes it actually triggers — and then a way to fix it.",
    objections: [
      {
        objection: "My CPA never mentioned this.",
        response: "CPAs file returns; this is forward planning — we bring them into the solution.",
      },
    ],
    crossSell: ["Quiet Wealth Transfer", "Qualified LTC"],
    coi: "CPA on the client's specific bracket and RMD picture.",
  },

  "buy-sell-life-insurance": {
    whatItIs:
      "Life insurance funds a buy-sell agreement so surviving owners can buy out a deceased owner's share with non-taxable proceeds.",
    idealClient: "Co-owned business (2+ owners) with no funded succession mechanism.",
    hook: "Guarantee the business stays with the surviving owners, not the deceased's spouse or heirs.",
    positioning:
      "Continuity and fairness. Non-taxable proceeds fund the purchase per the agreement while the policy remains in force.",
    pitch:
      "If your partner died tomorrow, you'd be in business with their spouse. A funded buy-sell means you buy their share with insurance proceeds and keep control.",
    objections: [
      {
        objection: "We have an agreement already.",
        response:
          "Is it funded? An unfunded agreement is a promise with no cash behind it — we fund the promise.",
      },
    ],
    crossSell: ["Corporate Reserve Fund", "Survivorship for the owners' estates"],
    coi: "Attorney on the agreement; CPA on entity structure/valuation.",
  },

  // Growth-log candidates (docs/31): NOT in the Brain yet — they enter via
  // the Pre-Launch Validation workflow (card + gate + owner sign-off). Their
  // playbook entries ship now, dormant, so the field layer is ready the day
  // they're approved. The Library only renders entries whose slug is a
  // documented strategy, so these never surface early.
  "cash-balance-plan": {
    whatItIs:
      "Qualified defined-benefit plan allowing large deductible contributions; a portion (per the plan's rules) funds life insurance inside the plan.",
    idealClient: "High-income business owner (often $500K+ earner) wanting large tax deductions beyond a 401(k).",
    hook: "Shelter far more than a 401(k) allows and add a protection layer inside the plan.",
    positioning:
      "Coordinated tax deferral plus in-plan life coverage. Respect §415(b) limits on life inside qualified plans (hard rule 9).",
    pitch:
      "Your 401(k) caps out well below what you'd like to shelter. A cash balance plan lets you deduct substantially more each year, and we can position coverage inside it.",
    objections: [
      {
        objection: "I don't want to fund employees.",
        response:
          "Plan design and the census determine cost — we model it; owner-heavy demographics often work well.",
      },
      {
        objection: "It's a long commitment.",
        response: "Contributions can flex within IRS ranges — we design for a range you can sustain.",
      },
    ],
    crossSell: ["Corporate Reserve Fund", "§162 for non-owner key employees"],
    coi: "TPA on plan design (incidental-benefit insurance allocation rules); CPA on deduction.",
  },

  "surety-bonding": {
    whatItIs:
      "A bonding program that supports contractors needing surety capacity, with life insurance layered into the relationship.",
    idealClient: "Contractor / business needing bonding capacity to win larger jobs.",
    hook: "Unlock bigger contracts by strengthening bonding capacity.",
    positioning:
      "Position as business-growth enablement with a protection layer. Keep claims conditioned and compliant.",
    pitch:
      "Your bonding capacity is capping the size of jobs you can bid. We can help strengthen that and add protection to the business at the same time.",
    objections: [
      {
        objection: "My agent handles bonding.",
        response: "We complement that — the insurance layer is what most bonding relationships miss.",
      },
    ],
    crossSell: ["Corporate Reserve Fund", "Key Person coverage"],
    coi: "Surety/bonding partner; CPA on financials.",
  },
};

export function fieldPlaybook(slug: string): FieldPlaybookEntry | undefined {
  return SALES_PLAYBOOK[slug];
}
