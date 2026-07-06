import type { ConceptLibraryEntry } from "./concept-library-types";

// Estate & Legacy concepts — agent-facing Library content (case study +
// top-10 CPA/client questions). Case studies are illustrative composites,
// never a real client. The client-facing one-pager for each concept comes
// from src/lib/pitch-deck-content.ts (compliance-filtered at render), and
// the internal explanation comes from the Strategy card itself — this file
// only adds what the card doesn't carry.

export const ESTATE_LEGACY_CONCEPTS: Record<string, ConceptLibraryEntry> = {
  "survivorship-second-to-die": {
    category: "estate_legacy",
    caseStudy: {
      title: "The ranch that stays a ranch",
      situation:
        "Married couple, 62 and 60, both reasonably healthy. Net worth ~$28M, dominated by a working ranch and two commercial buildings — under $1M liquid. With the exemption at $15M each, most of the estate is sheltered today, but growth and a surviving spouse's consolidated estate point to a real tax bill at the second death, payable in cash within nine months.",
      design:
        "Attorney drafts an ILIT naming the children as beneficiaries; the ILIT applies for and owns a survivorship policy on both spouses sized to the projected second-death liability. Annual exclusion gifts to the trust (with Crummey notices) fund premiums; joint-life pricing makes the coverage meaningfully cheaper than insuring either spouse alone.",
      outcome:
        "At the second death the trust receives the proceeds non-taxable and outside both estates, and lends to / purchases assets from the estate to create the cash the executor needs. No forced sale of the ranch. The CPA's file: trust instrument, Crummey notices, gift-tax returns, and the sizing memo.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why isn't the death benefit in the taxable estate?", a: "The ILIT is the original applicant, owner, and beneficiary — the insureds hold no §2042 incidents of ownership, and because there's no transfer of an existing policy, the §2035 three-year lookback never starts." },
      { asker: "cpa", q: "How do premium gifts avoid gift tax?", a: "Gifts to the trust qualify for the annual exclusion ($19,000 per donee in 2026) via Crummey withdrawal rights; amounts beyond that consume lifetime exemption on a filed gift-tax return." },
      { asker: "cpa", q: "Why survivorship instead of two single-life policies?", a: "The liquidity need matures at the second death — the unlimited marital deduction defers estate tax at the first — and joint mortality pricing buys more death benefit per premium dollar." },
      { asker: "client", q: "What happens if one of us is uninsurable?", a: "Survivorship underwriting prices two lives together, so one impaired spouse is often still insurable at reasonable rates — it's one of the design's practical advantages." },
      { asker: "client", q: "Can we get money back out if the law changes?", a: "The trust is irrevocable — you shouldn't count on retrieving gifts. Flexibility is engineered up front: trustee powers, policy choice, and in some designs a spousal beneficiary interest." },
      { asker: "cpa", q: "What if the exemption changes again?", a: "The $15M exemption is permanent under OBBBA (indexed from 2026), but 'permanent' means 'until Congress acts' — the sizing memo should be revisited whenever the law or the balance sheet moves." },
      { asker: "client", q: "Who controls the trust?", a: "A trustee you select — typically not you or your spouse. The trustee pays premiums, sends the notices, and administers the proceeds under the trust's terms." },
      { asker: "cpa", q: "How do the proceeds actually get liquidity into the estate?", a: "The trustee lends to the estate or buys estate assets at fair market value — the classic mechanics that put cash in the executor's hands without pulling the death benefit back into the gross estate." },
      { asker: "client", q: "What does this cost us each year?", a: "The premium — set by underwriting and the funding design. The comparison that matters is premium versus the estate's projected costs and what a forced sale would destroy." },
      { asker: "cpa", q: "Any GST angle?", a: "Yes — allocating GST exemption to the trust's gifts can make the entire death benefit exempt for grandchildren and beyond; the allocation belongs on the gift-tax returns from year one." },
    ],
  },

  "estate-funding": {
    category: "estate_legacy",
    caseStudy: {
      title: "First-death liquidity for a single-heir estate",
      situation:
        "Widowed business founder, 68, standard-plus health, $22M estate concentrated in company stock and real estate. No marital deduction ahead — the estate-tax event is her own death, and her son would inherit a cash-poor estate with a nine-month clock.",
      design:
        "ILIT owns a single-life policy on her from inception, sized to the projected liability above the $15M exemption plus settlement costs. Annual exclusion gifts fund premiums; the trustee documents every Crummey window.",
      outcome:
        "The trust stands ready to deliver cash on the exact day the obligation lands — the son keeps the company. Underwriting was the design's gating item, which is why the case ran health questions before anything was promised.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why single-life here instead of survivorship?", a: "No surviving spouse means no marital deferral — the tax bill arrives at the first (only) death, so the coverage has to mature then." },
      { asker: "cpa", q: "Same ILIT rules as survivorship?", a: "Identical chassis: trust as original owner (§2042/§2035), Crummey-powered exclusion gifts, gift-tax returns, arm's-length loans or purchases at settlement." },
      { asker: "client", q: "Why can't I just own the policy myself?", a: "Personally owned death benefit lands in your taxable estate and can be taxed at 40% — the trust exists so the liquidity arrives whole." },
      { asker: "client", q: "What if I live to 100?", a: "The design assumes you might: permanent coverage with a funding plan stress-tested to advanced ages, reviewed at every annual trust checkpoint." },
      { asker: "cpa", q: "How is the death-benefit amount defended?", a: "A sizing memo tying face amount to the projected liability: assets, growth assumptions, exemption at death, deductions, and settlement costs — refreshed as the balance sheet moves." },
      { asker: "client", q: "Does my son pay tax on the insurance money?", a: "Life insurance proceeds are received non-taxable under §101(a); the trust structure keeps them out of the estate-tax base as well." },
      { asker: "cpa", q: "What about an existing policy she already owns?", a: "Transferring it to the ILIT starts the §2035 three-year clock — hard rule. Where possible the trust applies for new coverage as original owner instead." },
      { asker: "client", q: "Can the trust money help with anything besides taxes?", a: "Yes — settlement costs, debt retirement, equalizing inheritances among heirs; the trust terms decide." },
      { asker: "cpa", q: "State estate tax?", a: "Out of this platform's scope by design — federal only. A state-level liability check belongs on the attorney/CPA worklist for residents of decoupled states." },
      { asker: "client", q: "How fast does this pay at death?", a: "Carriers typically pay clean claims in weeks — dramatically inside the nine-month federal estate-tax deadline the design is built around." },
    ],
  },

  "ilit-foundation-wrapper": {
    category: "estate_legacy",
    caseStudy: {
      title: "The wrapper that makes every other strategy work",
      situation:
        "Couple in their late 50s beginning serious estate work: $18M and compounding, existing personally-owned coverage, no trust architecture. Every strategy on their menu — survivorship, split-dollar, premium financing — assumed an ILIT that didn't exist yet.",
      design:
        "Attorney drafts the ILIT first; the trust then applies for the new coverage as original owner. The old personally-owned policy is left alone (a transfer would start the §2035 three-year clock) and scheduled for review instead.",
      outcome:
        "The family now has the chassis: proceeds outside both estates, Crummey-powered funding, a trustee running the compliance calendar. Every later strategy in their plan snaps onto this foundation — which is why the ILIT is sequenced before the products.",
    },
    topQuestions: [
      { asker: "cpa", q: "What makes the ILIT actually work?", a: "Original ownership (no §2042 incidents, no §2035 clock), real Crummey withdrawal rights with documented notices, and an independent trustee who administers rather than rubber-stamps." },
      { asker: "cpa", q: "Grantor trust status — problem or feature?", a: "Usually a feature: the grantor paying the trust's income tax is, in effect, an additional transfer the gift-tax system doesn't count. Confirm the intended status against the trust's powers." },
      { asker: "client", q: "Irrevocable sounds permanent. Is it?", a: "The commitment is real — that's what removes the proceeds from your estate. Modern drafting builds in flexibility: trustee discretion, trust-protector provisions, and policy-level choices." },
      { asker: "client", q: "Who should be trustee?", a: "Someone independent — a trusted professional, institution, or capable family member who is not you. Grantor-as-trustee is how estates get pulled back in." },
      { asker: "cpa", q: "What does the annual compliance calendar look like?", a: "Gift → Crummey notice → open withdrawal window → premium payment → file the notice; plus gift-tax returns for reported gifts and any GST allocation." },
      { asker: "client", q: "Can my spouse benefit from the trust while I'm alive?", a: "A spousal-access design can permit distributions to your spouse — that's the SLAT variant, a deliberate choice with its own tradeoffs." },
      { asker: "cpa", q: "What breaks these trusts in audit?", a: "Sham administration: missed notices, premiums paid personally, grantor control. The structure survives on formalities — hence the checklist discipline." },
      { asker: "client", q: "What if we already have a policy we like?", a: "Moving it into the trust restarts the three-year lookback, so the default is new coverage with the trust as original applicant; existing policies get a case-by-case review." },
      { asker: "cpa", q: "How do beneficiaries eventually receive proceeds?", a: "Per trust terms — outright, in continuing trust, or dynasty-style if GST exemption was allocated. The instrument, not the policy, controls." },
      { asker: "client", q: "Why do this before the other strategies?", a: "Because ownership from inception is the whole game — retrofitting costs three years of lookback risk. The wrapper comes first so everything placed inside it is clean." },
    ],
  },

  slat: {
    category: "estate_legacy",
    caseStudy: {
      title: "Locking the exemption without locking out the household",
      situation:
        "Married couple, both 54, $24M and growing fast on a business trajectory. They want to use exemption now against future growth, but 'we can never touch it again' was the objection that had stalled every prior proposal.",
      design:
        "One spouse funds a SLAT for the other's benefit (plus descendants), using lifetime exemption. The trustee may distribute to the beneficiary spouse — so household access continues indirectly — and trust assets, including a policy on the grantor spouse, grow outside both estates.",
      outcome:
        "Exemption is applied against tomorrow's value at today's number, coverage inside the trust adds non-taxable leverage, and the access objection dissolves. Divorce and death-of-beneficiary-spouse contingencies were addressed in drafting — the two risks every SLAT conversation must own.",
    },
    topQuestions: [
      { asker: "cpa", q: "What kills a SLAT in audit?", a: "The reciprocal-trust doctrine — two spouses creating mirror-image trusts for each other. Trusts must differ materially in terms, timing, assets, and trustees." },
      { asker: "client", q: "So we can still use the money?", a: "Indirectly: the trustee can distribute to the beneficiary spouse under the trust's standards while you're both alive and married. It's access through the household, not a personal checkbook." },
      { asker: "cpa", q: "What happens on divorce?", a: "The beneficiary spouse typically stops benefiting — drafting can define 'spouse' floatingly or add contingencies. This is the design's most litigated soft spot; it gets addressed in the instrument, not hoped away." },
      { asker: "client", q: "What if my spouse dies first?", a: "The indirect access dies too — a policy on the beneficiary spouse, or paired planning, is often layered in to hedge exactly that." },
      { asker: "cpa", q: "Gift-splitting on the funding gift?", a: "Generally no — a gift to a trust where the spouse is a beneficiary usually can't be split. The funding spouse uses their own exemption; plan the balance sheets accordingly." },
      { asker: "client", q: "Why act now instead of at death?", a: "A gift removes tomorrow's growth at today's value. On a fast-compounding balance sheet the difference between gifting now and bequeathing later is the tax on all the intervening appreciation." },
      { asker: "cpa", q: "Grantor trust consequences?", a: "SLATs are typically grantor trusts — the funding spouse pays trust income tax, an uncounted extra transfer, and policy premiums can be funded from trust assets without new gifts." },
      { asker: "client", q: "Whose life does the trust insure?", a: "Commonly the grantor spouse — the trust owns the policy from inception, adding non-taxable death benefit to a bucket already outside both estates." },
      { asker: "cpa", q: "Basis tradeoff acknowledged?", a: "Yes — gifted assets carry over basis rather than stepping up at death. The design targets high-growth, low-basis-sensitivity assets, and the memo should show that comparison." },
      { asker: "client", q: "Can we each do one?", a: "Sometimes — but not as mirror images (see the reciprocal-trust question). Sequenced, materially different trusts drafted by counsel are the safe pattern." },
    ],
  },

  "dynasty-gst-trust": {
    category: "estate_legacy",
    caseStudy: {
      title: "One tax, then never again",
      situation:
        "Patriarch, 60, preferred health, $40M with strong-growth operating assets already destined for grandchildren. On the default path the same wealth faces transfer tax at his death, his children's deaths, and every generation after.",
      design:
        "Dynasty trust in a jurisdiction permitting perpetual (or very long) terms; funding gift uses lifetime exemption with GST exemption allocated dollar-for-dollar, making the trust permanently GST-exempt. The trustee buys life coverage on the grantor — converting exempt premium dollars into a much larger exempt death benefit.",
      outcome:
        "Wealth inside the trust now passes to children, grandchildren, and beyond without further estate or GST tax at each generation. The insurance multiplies what one round of exemption shelters; the compounding difference across two generations is the whole argument.",
    },
    topQuestions: [
      { asker: "cpa", q: "Why is GST allocation the critical filing?", a: "GST exemption equals the estate exemption ($15M in 2026) but is NOT portable — use it or lose it, and a late or missed allocation on the gift-tax return can poison the trust's exempt status." },
      { asker: "cpa", q: "What does 'zero inclusion ratio' mean in practice?", a: "Fully GST-exempt: distributions and terminations at every generational level avoid the GST tax permanently, regardless of how large the trust grows." },
      { asker: "client", q: "Do my kids get anything, or does it all skip to grandkids?", a: "Both, typically — children can be discretionary beneficiaries for life while the remainder rolls down generations. 'Dynasty' describes duration, not exclusion." },
      { asker: "client", q: "Why put life insurance inside it?", a: "Leverage: exempt dollars buy premiums, and the non-taxable death benefit lands inside the exempt wrapper — one round of exemption shelters a multiple of itself." },
      { asker: "cpa", q: "Which situs and why?", a: "A state without (or with a very long) rule against perpetuities and with favorable trust law — situs selection is an attorney decision documented in the file." },
      { asker: "client", q: "How long can this actually last?", a: "In perpetual-trust states, indefinitely; elsewhere, centuries under extended perpetuities periods. Practically: as long as there are descendants and assets." },
      { asker: "cpa", q: "Interaction with the ILIT rules?", a: "Full overlap — original ownership of policies, Crummey mechanics if exclusion gifts are used (with GST-safe drafting), and the same administration discipline." },
      { asker: "client", q: "Can future generations change it?", a: "Within limits the instrument sets — powers of appointment, trust protectors, and decanting statutes provide controlled flexibility without breaking the exemption." },
      { asker: "cpa", q: "What's the biggest execution error you see?", a: "Exemption allocated late or inconsistently across contributions — every gift into the trust needs a matching, timely GST allocation to keep the inclusion ratio at zero." },
      { asker: "client", q: "Is this only for the ultra-wealthy?", a: "It's for families whose wealth will outlive their children — the earlier the trust starts compounding exempt, the more one exemption round ultimately shelters." },
    ],
  },

  "qprt-insurance-hedge": {
    category: "estate_legacy",
    caseStudy: {
      title: "The house, discounted — with the mortality risk hedged",
      situation:
        "Widow, 66, excellent health, $9M primary residence in an appreciating market inside a $21M estate. She wants the home to pass to her daughters at a fraction of its value — but a QPRT only works if she survives the term.",
      design:
        "Ten-year QPRT: she transfers the residence, retaining the right to live in it for the term; the taxable gift is only the discounted remainder value. Because dying mid-term pulls the full house value back into her estate, an ILIT-owned life policy on her, sized to the contingent tax exposure and running the QPRT term, hedges the mortality risk.",
      outcome:
        "Survive the term: the house (plus all appreciation) is out of the estate at a deeply discounted gift cost, and she rents it back at fair market — pushing even more value out. Die mid-term: the insurance makes the estate whole. Either branch is planned, which is what made the client comfortable signing.",
    },
    topQuestions: [
      { asker: "cpa", q: "How is the gift valued?", a: "Remainder interest under §7520 rates at funding — the retained term interest discounts the gift well below the home's fair market value; higher rates deepen the discount." },
      { asker: "cpa", q: "What exactly happens if she dies in year 7?", a: "§2036 pulls the full date-of-death value back into the gross estate (with a credit for exemption used). That contingency is precisely what the term-matched insurance hedge is sized against." },
      { asker: "client", q: "Can I keep living there after the ten years?", a: "Yes — by paying fair-market rent to the trust or your daughters. The rent itself is another estate-reduction channel, not a bug." },
      { asker: "cpa", q: "Rent must be genuinely fair-market?", a: "Yes, documented with comparables and actually paid — below-market occupancy invites a §2036 retained-enjoyment argument that unwinds the whole structure." },
      { asker: "client", q: "What if I want to sell the house mid-term?", a: "The QPRT can sell and buy a replacement residence; excess proceeds follow regulatory conversion rules (often to a GRAT-like annuity). It's handled, but it complicates — flag it early." },
      { asker: "cpa", q: "Basis consequence for the daughters?", a: "Carryover basis — no step-up. The tradeoff memo should compare estate-tax saved against capital-gain exposure if they'd ever sell." },
      { asker: "client", q: "Why not just gift the house outright?", a: "An outright gift uses exemption at full value; the QPRT gifts a discounted remainder while you keep living there. Same destination, materially cheaper ticket." },
      { asker: "cpa", q: "How is the hedge policy structured?", a: "ILIT-owned from inception (standard §2042/§2035 discipline), term or permanent coverage matched to the QPRT term and sized to the contingent estate-tax delta." },
      { asker: "client", q: "Does the term length matter?", a: "Longer terms discount more but raise survival risk; the sweet spot balances her age, health, and the hedge premium — it's an actuarial conversation, not a default." },
      { asker: "cpa", q: "GST caution?", a: "QPRTs are poor GST vehicles (the ETIP rule blocks allocation until the term ends) — generation-skipping goals belong in a different bucket of the plan." },
    ],
  },

  "quiet-wealth-transfer": {
    category: "estate_legacy",
    caseStudy: {
      title: "Moving wealth without moving the family politics",
      situation:
        "Couple, 58 and 57, $12M, three adult children with very different money maturity. They want meaningful transfer started now — without dinner-table entitlement, without the children even needing to know the numbers yet.",
      design:
        "Annual exclusion gifts fund trust-owned permanent life coverage on the parents. The policy quietly converts each year's modest gifts into a substantial, non-taxable future benefit; the trust's terms — not the children's expectations — govern who receives what, when, and with what conditions.",
      outcome:
        "Wealth compounds outside the estate behind the trust's privacy, the parents retain full lifestyle assets, and the family conversation happens on the parents' timeline. The CPA's file is the standard ILIT stack: instrument, notices, gift returns.",
    },
    topQuestions: [
      { asker: "client", q: "Do the children have to know?", a: "Crummey notices must genuinely reach withdrawal-right holders — but drafting can use a modest set of notice recipients, and knowledge of a right is not knowledge of the balance sheet." },
      { asker: "cpa", q: "Are those Crummey rights real if you hope nobody exercises them?", a: "They must be legally real — actual notice, actual window, actual funds available. Hoping they lapse is fine; making them illusory is how exclusions get disallowed." },
      { asker: "client", q: "Why life insurance instead of a brokerage account in trust?", a: "Leverage plus discipline: small annual gifts purchase a large non-taxable death benefit, tax-deferred growth inside the policy, and none of it tempts anyone as a spendable balance." },
      { asker: "cpa", q: "MEC discipline on the funding?", a: "Yes — stay inside the §7702A seven-pay limits if lifetime access to cash value matters; a MEC is irrevocable once triggered (hard rule) and changes the distribution tax order." },
      { asker: "client", q: "Can we attach conditions — school, work, sobriety?", a: "The trust terms can hold, stagger, and condition distributions almost any way counsel can draft — that's exactly why the wealth moves through a trust rather than a beneficiary form." },
      { asker: "cpa", q: "What does 'quiet' cost in tax terms?", a: "Nothing structural — it's the standard exclusion-gift ILIT pattern; the quietness comes from trust privacy and pacing, not from any exotic (or aggressive) position." },
      { asker: "client", q: "What if a child divorces?", a: "Assets in a properly administered trust are generally far better insulated from a beneficiary's divorce than outright gifts — another argument for the wrapper." },
      { asker: "client", q: "Can we change our minds about a child?", a: "The gifts are irrevocable, but powers of appointment, trust-protector provisions, and discretionary standards preserve real steering room within the instrument." },
      { asker: "cpa", q: "When does this stop being 'quiet' and need a bigger structure?", a: "When desired transfer outpaces annual exclusions — that's the trigger to layer lifetime-exemption gifts, a SLAT, or a dynasty design on top of the same chassis." },
      { asker: "client", q: "What's the first step?", a: "The attorney drafts the trust; the trust applies for the coverage; the first year's gifts and notices set the rhythm. Sixty days start to finish in a typical case." },
    ],
  },

  "family-income-legacy": {
    category: "estate_legacy",
    caseStudy: {
      title: "The blend: paycheck protection now, legacy later",
      situation:
        "Household breadwinner, 41, two kids under 10, $310K income, good health. Needs are stacked: replace 15+ years of income if the worst happens, fund college regardless, and start a permanent legacy layer — on a budget that can't do everything at permanent-policy prices.",
      design:
        "Blend: a large 20-year term layer sized to income replacement and the mortgage/college window, plus a permanent base policy the family keeps for life, with cash value building. Convertibility on the term layer preserves the right to upgrade later without new underwriting.",
      outcome:
        "Full protection today at a payable premium, a permanent asset compounding underneath, and options at every review: convert term as income grows, or let it expire as the kids launch. The design flexes with the family instead of asking them to predict 2050 in one purchase.",
    },
    topQuestions: [
      { asker: "client", q: "How much coverage is 'enough'?", a: "Work backward: years of income to replace, minus assets, plus fixed obligations (mortgage, college). The intake's numbers drive it — 'ten times income' is a slogan, not a plan." },
      { asker: "client", q: "Why not all term — it's so much cheaper?", a: "Term solves the window; it expires exactly when lifetime needs (final expenses, spousal support, legacy) remain. The blend buys the window AND keeps a permanent floor." },
      { asker: "client", q: "Why not all permanent?", a: "At this income-replacement size, all-permanent premiums crowd out saving. The blend puts expensive dollars only where lifetime coverage is actually the goal." },
      { asker: "cpa", q: "Tax character of the pieces?", a: "Premiums are personal (nondeductible); death benefit is non-taxable under §101(a); permanent cash value grows tax-deferred with basis-first withdrawals under §72(e) if accessed." },
      { asker: "client", q: "What does convertibility really give us?", a: "A unilateral right to exchange term for permanent at the original health class — insurance against becoming uninsurable, which is the risk nobody prices until it happens." },
      { asker: "client", q: "Should the policy be in a trust like the big estates do?", a: "At this estate size, usually simple ownership with clean beneficiary designations; a trust enters when minor-child management, blended-family, or estate-tax facts call for it." },
      { asker: "cpa", q: "Beneficiary hygiene items?", a: "Contingents named, no minor children as direct beneficiaries (use UTMA or trust), and a review on every birth, divorce, or job change — stale designations are the most common estate failure at this tier." },
      { asker: "client", q: "What happens at the end of the 20-year term?", a: "By design, nothing bad: the window it covered has closed. Options before then — convert some, keep the permanent base, re-shop if health is still strong." },
      { asker: "client", q: "Can we touch the permanent policy's cash value?", a: "Yes — withdrawals to basis and policy loans, with the standard caution that unmanaged loans can stress the policy; benefits apply while the policy remains in force." },
      { asker: "cpa", q: "MEC check on the permanent layer?", a: "Standard §7702A seven-pay testing at issue and on any premium change — keep it a non-MEC so lifetime access keeps FIFO treatment." },
    ],
  },
};
