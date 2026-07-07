# Life Insurance Sales Playbook (v1 — ingested 2026-07-07)

> Source: owner-supplied "Life Insurance Sales Playbook" (docx). This is the field-sales
> layer of the Brain: per strategy — what it is, the ideal client, the hook, compliant
> positioning, the pitch, objections with responses, cross-sell, and the COI to involve.
> It is a **living document**: new strategies drop in using the same eight-field format.
>
> **Where this lives in the product:** the per-strategy entries below are wired into the
> Case Atlas concept Library (`src/lib/sales-playbook.ts`) and render as the "Field
> playbook" section on each concept page. This doc is the source of truth for edits.
>
> **Compliance standards applied throughout:** say "non-taxable" not "tax-free"; condition
> benefit claims with "while the policy remains in force"; no specific outcome
> quantification, IRS form numbers, or underlying structure names in client-facing copy;
> lead with diagnosis, not product. (These pitches are agent-delivered talk tracks — the
> in-app compliance filter still governs anything generated for a client to read.)

## Strategy → Library mapping

| Playbook entry | Library concept (slug) | Status |
|---|---|---|
| Corporate Reserve Fund (COLI) | `coli-corporate-reserve` | Live |
| §162 Executive Bonus / REBA | `section-162-executive-bonus-reba` | Live |
| Quiet Wealth Transfer (SPIA bridge → ILIT) | `quiet-wealth-transfer` | Live |
| Survivorship Life / Estate Funding | `survivorship-second-to-die` | Live |
| Qualified LTC Funding | `qualified-ltc` | Live |
| Inheritance Tax Trap (Diagnostic) | `rmd-repositioning` | Live (the diagnostic IS its opener) |
| Buy-Sell Funding | `buy-sell-life-insurance` | Live |
| Cash Balance Plan | `cash-balance-plan` | **Growth-log candidate — NOT in the Brain yet.** Enters via the Pre-Launch Validation workflow (docs/09): needs a full strategy card + recommendation gate + owner sign-off. Playbook entry ships now so the field layer is ready on approval. |
| Surety Bonding | `surety-bonding` | **Growth-log candidate — NOT in the Brain yet.** Same path as above. |

---

## Corporate Reserve Fund (COLI) → `coli-corporate-reserve`

- **What it is:** Company-owned life insurance on owners/key people; cash value builds a non-taxable corporate reserve while the policy remains in force.
- **Ideal client / trigger:** C-Corp / profitable business with retained earnings sitting in low-yield accounts.
- **Why it sells (the hook):** Turn idle retained earnings into a tax-advantaged reserve that also protects the business if a key person is lost.
- **Positioning (compliant):** Position as a balance-sheet asset and key-person protection, not a product sale. Non-taxable growth while the policy remains in force.
- **The pitch:** "You're holding cash earning almost nothing and fully taxable. We can reposition a portion into a corporate reserve that grows without current tax, stays accessible to the business, and pays the company if you lose a key person."
- **Objections → responses:**
  - "We don't have extra cash." → It's a reposition, not new money — we move a slice of what's already sitting idle.
  - "Why not just invest it?" → This layer is non-correlated, non-taxable while in force, and adds death-benefit protection an investment account can't.
- **Cross-sell / next:** §162/REBA for the same key employees; Buy-Sell funding.
- **COI needed:** CPA on §101(j) notice-and-consent (required before issue) and balance-sheet treatment.

## §162 Executive Bonus / REBA → `section-162-executive-bonus-reba`

- **What it is:** Employer bonuses fund a personally-owned permanent policy for a key employee; REBA adds a vesting restriction (golden handcuffs).
- **Ideal client / trigger:** Business owner wanting to retain/reward key people without ERISA or qualified-plan complexity.
- **Why it sells (the hook):** Reward your best people with a benefit they can see and feel, and tie them to you with a vesting schedule.
- **Positioning (compliant):** Frame as coordinated, tax-efficient compensation. Employer deduction under reasonable-comp rules; employee owns the policy.
- **The pitch:** "You want to keep your top producer. We bonus the premium on a policy they own, add a vesting restriction so it rewards them for staying, and the business deducts it as compensation."
- **Objections → responses:**
  - "It's taxable to the employee." → Yes — we gross up the bonus so the benefit is net-neutral to them and still deductible to you.
  - "What stops them leaving?" → The restrictive endorsement — they don't get full access to cash value until they vest.
- **Cross-sell / next:** Corporate Reserve Fund; Phantom stock as a second retention layer.
- **COI needed:** CPA on reasonable-compensation support and deductibility.

## Quiet Wealth Transfer (SPIA bridge → ILIT) → `quiet-wealth-transfer`

- **What it is:** Reposition an annuity/IRA through a SPIA that pays annual income; after-tax income funds a life policy inside an ILIT, moving wealth to heirs non-taxable while in force.
- **Ideal client / trigger:** Qualified-fund-heavy pre-retiree with money they don't need for income, wanting to leave more to heirs.
- **Why it sells (the hook):** Convert a taxable, RMD-burdened account into a larger, non-taxable legacy for the family.
- **Positioning (compliant):** Diagnosis-first, structurally efficient transfer. Never name the underlying mechanics or form numbers in client copy. Non-taxable to heirs while the policy remains in force.
- **The pitch:** "This account is going to hit your heirs with a tax bill on a compressed timeline. We can reposition it so it delivers a larger, non-taxable benefit to the family instead."
- **Objections → responses:**
  - "I might need that money." → Then it's not a candidate — this is only for dollars you've earmarked for heirs.
  - "Taxes on the conversion?" → Handled with a bridge that spreads it; your advisor models the net — we only proceed if the family comes out ahead.
- **Cross-sell / next:** Inheritance Tax Trap diagnostic; Survivorship for married couples.
- **COI needed:** CPA/attorney on the ILIT (original-owner requirement, §2035 timing) and tax modeling.

## Survivorship Life / Estate Funding → `survivorship-second-to-die`

- **What it is:** Second-to-die policy in an ILIT provides non-taxable liquidity at the second death, when estate tax is actually due.
- **Ideal client / trigger:** Married couple with an illiquid taxable estate (real estate, business, collectibles).
- **Why it sells (the hook):** Pay the estate tax bill with discounted dollars instead of forcing a fire-sale of the business or property.
- **Positioning (compliant):** Liquidity timed to the taxable event. Lower cost per benefit dollar than two single-life policies. Non-taxable while in force and held outside the estate.
- **The pitch:** "Your estate is rich but cash-poor. At the second death the IRS wants cash your heirs would have to raise by selling assets. Survivorship life delivers that cash, non-taxable, at a fraction of the cost."
- **Objections → responses:**
  - "Exemptions are high now." → They can change, and even under today's rules your overage is exposed — this sizes to the actual projected bill.
  - "We're both getting older." → Joint mortality pricing usually still beats two single policies — we illustrate both.
- **Cross-sell / next:** ILIT wrapper (always); Dynasty/GST allocation for grandchildren.
- **COI needed:** Estate attorney on the ILIT and Crummey process; CPA on projected estate tax.

## Qualified LTC Funding → `qualified-ltc`

- **What it is:** Reposition qualified or non-qualified dollars into a life/LTC or annuity/LTC vehicle providing non-taxable LTC benefits while in force.
- **Ideal client / trigger:** Pre-retiree worried about long-term-care cost eroding the estate.
- **Why it sells (the hook):** Cover a care event without the use-it-or-lose-it problem of traditional LTC.
- **Positioning (compliant):** Frame as protecting the family's assets from a care event. Individually-owned IRA required; a spouse's IRA cannot fund joint LTC benefits (hard rule 8).
- **The pitch:** "A long care event is the single biggest threat to your retirement assets. We can reposition idle dollars into a vehicle that pays for care non-taxable — and pays your heirs if you never need it."
- **Objections → responses:**
  - "I might never use it." → Unlike old LTC, if you don't use it the death benefit goes to your family — the money isn't lost.
  - "It's expensive." → We reposition existing assets rather than adding a new premium out of cash flow.
- **Cross-sell / next:** Estate Funding; Survivorship for couples.
- **COI needed:** CPA on IRA ownership rules (individual ownership; no joint-benefit funding).

## Inheritance Tax Trap (Diagnostic) → `rmd-repositioning`

- **What it is:** A diagnostic that shows how one forced RMD cascades into multiple taxes and a compressed payout clock for heirs.
- **Ideal client / trigger:** Qualified-fund-heavy client who assumes their IRA passes cleanly to the kids.
- **Why it sells (the hook):** Show the client the hidden tax cascade sitting inside their retirement account — then solve it.
- **Positioning (compliant):** Diagnosis is the close. Educate first, then present repositioning. No form numbers or structure names in client copy.
- **The pitch:** "Most people think their IRA goes to the kids intact. Let me show you the cascade of taxes it actually triggers — and then a way to fix it."
- **Objections → responses:**
  - "My CPA never mentioned this." → CPAs file returns; this is forward planning — we bring them into the solution.
- **Cross-sell / next:** Quiet Wealth Transfer; Qualified LTC.
- **COI needed:** CPA on the client's specific bracket and RMD picture.

## Buy-Sell Funding → `buy-sell-life-insurance`

- **What it is:** Life insurance funds a buy-sell agreement so surviving owners can buy out a deceased owner's share with non-taxable proceeds.
- **Ideal client / trigger:** Co-owned business (2+ owners) with no funded succession mechanism.
- **Why it sells (the hook):** Guarantee the business stays with the surviving owners, not the deceased's spouse or heirs.
- **Positioning (compliant):** Continuity and fairness. Non-taxable proceeds fund the purchase per the agreement while the policy remains in force.
- **The pitch:** "If your partner died tomorrow, you'd be in business with their spouse. A funded buy-sell means you buy their share with insurance proceeds and keep control."
- **Objections → responses:**
  - "We have an agreement already." → Is it funded? An unfunded agreement is a promise with no cash behind it — we fund the promise.
- **Cross-sell / next:** Corporate Reserve Fund; Survivorship for the owners' estates.
- **COI needed:** Attorney on the agreement; CPA on entity structure/valuation.

## Cash Balance Plan → `cash-balance-plan` (growth-log candidate)

- **What it is:** Qualified defined-benefit plan allowing large deductible contributions; a portion (per the plan's rules) funds life insurance inside the plan.
- **Ideal client / trigger:** High-income business owner (often $500K+ earner) wanting large tax deductions beyond a 401(k).
- **Why it sells (the hook):** Shelter far more than a 401(k) allows and add a protection layer inside the plan.
- **Positioning (compliant):** Coordinated tax deferral plus in-plan life coverage. Respect §415(b) limits on life inside qualified plans (hard rule 9).
- **The pitch:** "Your 401(k) caps out well below what you'd like to shelter. A cash balance plan lets you deduct substantially more each year, and we can position coverage inside it."
- **Objections → responses:**
  - "I don't want to fund employees." → Plan design and the census determine cost — we model it; owner-heavy demographics often work well.
  - "It's a long commitment." → Contributions can flex within IRS ranges — we design for a range you can sustain.
- **Cross-sell / next:** Corporate Reserve Fund; §162 for non-owner key employees.
- **COI needed:** TPA on plan design (incidental-benefit insurance allocation rules); CPA on deduction.

## Surety Bonding → `surety-bonding` (growth-log candidate)

- **What it is:** A bonding program that supports contractors needing surety capacity, with life insurance layered into the relationship.
- **Ideal client / trigger:** Contractor / business needing bonding capacity to win larger jobs.
- **Why it sells (the hook):** Unlock bigger contracts by strengthening bonding capacity.
- **Positioning (compliant):** Position as business-growth enablement with a protection layer. Keep claims conditioned and compliant.
- **The pitch:** "Your bonding capacity is capping the size of jobs you can bid. We can help strengthen that and add protection to the business at the same time."
- **Objections → responses:**
  - "My agent handles bonding." → We complement that — the insurance layer is what most bonding relationships miss.
- **Cross-sell / next:** Corporate Reserve Fund; Key Person coverage.
- **COI needed:** Surety/bonding partner; CPA on financials.

---

## Growth log (add new strategies here)

Reserve this section for strategies and content added after v1. For each new entry, follow
the same eight-field format above, add the entry to `src/lib/sales-playbook.ts` keyed by the
strategy slug, and — for a brand-new strategy — seed it as `pending_content` so it goes
through the "Approve & go live" workflow (Brain lock) before Atlas can recommend it.
Advanced trust structures (ILIT, SLAT, Dynasty/GST, Premium Financing, Private Split-Dollar,
IDGT, CRT + wealth replacement, FLP) are detailed in docs/advanced-case-design-framework.md
and already live in the Library; fold their client-facing sales entries in here as ready.
