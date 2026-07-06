# Insurance Strategy Engine — Master Developer Brief

## Purpose
This is the consolidation document your developer reads first. It ties together every spec, every rule, every decision captured during the build. If your dev reads only one document before starting, it should be this one.

**What this is NOT:** This is not the strategy library itself. That's a separate document (the brain). This is the roadmap for the app your developer is going to build.

---

## 1. The Product in One Paragraph

A Jarvis-style AI strategy engine for life insurance and annuity producers, built on a locked library of 9 core + 8 supporting strategies (see the brain doc). The agent types or speaks a client scenario — "I've got a guy" — and the engine returns a full case design with pitch deck, marketing pieces, illustrations needed, and the order of operations for the sales meeting. v1 is direct-to-agent at $297/month; v2 is white-label distribution to IMOs/FMOs/BGAs at $75/seat/month, tiered by seat count.

**Three-position positioning (confirmed):**
1. **Recruiting tool** — for individual agents at $100K+ for 3-5 years who want to expand
2. **Retention tool** — once an agent uses it, they can't un-experience it
3. **Revenue tool** — for IMOs/FMOs/BGAs to add to their tech stack and grow production

**Brand vibe:** Elegant, rich, premium feel — like the agent is holding something expensive and rare. The promise is based on the agent's actual book of business. No guarantees, no specific income claims, no false claims. All claims trace back to the agent's own data.

---

## 2. The 4-Layer Engine (Core Architecture)

| Layer | What it does | Phase |
|---|---|---|
| **1. "I've got a guy" intake + strategy recommender** | Conversational intake → avatar classification → strategy recommendation → pivot-to-alternative → wholesaler handoff | 3 |
| **2. Pitch deck and marketing auto-generator** | Customized pitch deck, marketing piece, illustrations needed, order of operations | 4 |
| **3. Strategy library (the brain)** | 9 core + 8 supporting strategies, locked, with cross-cutting rules, mapping tables, standing principles | 3 |
| **4. Video recommender** | Relevant training video surfaces when a strategy is recommended (Netflix-for-case-design) | 4 |

## 3. The 4 Supporting Layers

| Layer | What it does | Phase |
|---|---|---|
| **5. Agent onboarding and customization** | Voice vs. type, PDF vs. deck, output preferences, memory | 2 |
| **6. Avatar matching** | Classify prospect into 1+ of 4 avatars (HNW / Business Owner / Qualified Fund Heavy / Family-Legacy) | 3 |
| **7. Prospecting list + per-prospect pitch deck + weekly call queue** | "This week, call these 3 prospects with these pitches" | 4 |
| **8. Progress tracker + revenue dashboard** | This week's pipeline, this year's pipeline, book-of-business opportunity, closed | 4 |

## 9. The 4 Avatars (mapped to the strategies)

| Avatar | Who | Lead Brain | Primary Strategies |
|---|---|---|---|
| **High Net Worth** | $2M+ net worth, complex estates, family wealth | Luke Britt | Survivorship, Estate Funding, Premium Financing, GRATs |
| **Business Owner** | C-Corp, S-Corp, partnership, LLC with employees | Jay + Luke | Buy-sell, COLI, §162/REBA, Phantom Stock, Key Person, Buy-Sell Funding, Surety Bonding, Cash Balance |
| **Qualified Fund Heavy** | $500K+ in IRA/401(k), often pre-retiree | Jay Peak | Quiet Wealth Transfer, RMD Repositioning, Roth+Life, Annuity Rescue, Qualified LTC, Inheritance Tax Trap (diagnostic) |
| **Family / Legacy** | Dependents, income protection, legacy for kids/grandkids | Jay Peak | Term, permanent, education funding, legacy trusts, SPWL, Disability Income Protection |

## 5. The 9 Non-Negotiable Hard Rules (engine-level enforcement, not just documentation)

1. **Direct annuity-to-life §1035 exchange is NEVER valid** — must route through SPIA income funding premiums
2. **§1035 is for non-qualified contracts only** — qualified money uses rollover/transfer rules
3. **Life-to-life §1035 requires same insured, same owner**
4. **ILIT must be original owner** to avoid 3-year lookback §2035
5. **COLI requires §101(j) notice and consent before issue**
6. **MEC status is irrevocable once triggered**
7. **§162 executive bonus must qualify as reasonable compensation**
8. **Spouse IRA cannot fund joint LTC benefits** — prohibited transaction
9. **§415(b) limits apply to life insurance inside qualified plans**

## 6. Compliance Language Standards (filter on every output)

- Use **"non-taxable"** NEVER "tax-free" in client-facing copy
- Always condition benefit claims with **"while the policy remains in force"**
- **Do not quantify specific outcomes** in client-facing copy
- **Do not name** underlying repositioning structures or specific IRS form numbers in client-facing copy
- Frame the value as the **approach** (diagnosis-first, coordinated, structurally efficient), not as a product sale
- **No "Firm Advantage"** or any language implying a CPA is on staff
- **No guarantees.** No specific income claims. No "we guarantee you'll make $X"

## 7. The 3-Layer Guardrail System

- **Layer 1 — Compliance engine:** every output filtered against the compliance language standards above
- **Layer 2 — Brain lock:** engine can ONLY recommend from the locked strategy library. No AI invention. New strategies go through pre-launch validation first
- **Layer 3 — Client profile filter:** engine checks age, health, structure, time horizon, ownership % before recommending. Pivot-to-alternative when primary doesn't fit

## 8. Operational / Billing Layer (Phase 1 + Phase 5)

- **Login system** with admin control (grant, revoke, suspend access at any time)
- **Monthly billing** at $297/mo for individual agents
- **Annual billing** with ~16-20% discount for annual prepay (target $2,970/yr)
- **Special pricing for participating IMOs** — tiered per-seat rate at $75/seat/month base (50/100/500+ seats)
- **Admin dashboard:** logins, activity, churn, prospects added, strategies recommended, pitches built
- **Master dashboard:** every client (agent and IMO), channel attribution, MRR by segment, activity, churn, support, opportunity flow with verification + modification + learning loop, compliance flag queue

## 9. The 6-Phase Build Plan (summary)

| Phase | Milestone | What ships |
|---|---|---|
| 1 | The Skeleton | Web app, login, Stripe billing at $297/mo, admin controls |
| 2 | The Brand | Name, tagline, visual, marketing site, branded UI |
| 3 | The Brain | Strategy library ingested, intake flow, avatar matching, recommendations, pivots, compliance guardrails, 9 hard rules enforced, pre-launch validation |
| 4 | The Output | Pitch deck generator, per-prospect decks, marketing pieces, progress dashboard, prospecting list, weekly call queue, video recommender |
| 5 | The Operations | Master dashboard, opportunity flow with learning loop, compliance queue, annual billing, IMO pricing tiers, white-label engine |
| 6 | The Polish | iPhone-moment polish, behavioral triggers, onboarding refinement, email sequence integration, launch commercial production |

**Full phased plan with Copilot batching per phase:** see the Phased Build Plan doc.

## 10. GitHub Copilot Batching Rules

- **One well-bounded user story per Copilot session**
- **5-10 related changes inside that session**
- State the goal, files in scope, constraints, and definition of done up front
- Let Copilot make the largest safe change within that scope
- Split into a new session when the work branches
- **Don't:** bundle multiple unrelated features, split a single feature into many micro-prompts, send "fix everything" prompts
- **Do:** one prompt = one user story = one session

## 11. The Pre-Launch Validation Process (recurring, not one-time)

For every new strategy that goes into the brain:

1. Strategy proposed (Jay, Luke, or senior producer)
2. Engine interviews the human team (asks diagnostic questions)
3. Engine requests documentation (illustrations, decks, marketing pieces)
4. Human team provides documentation
5. Engine drafts the strategy card in the uniform template
6. Human team reviews and signs off
7. Engine goes live with the strategy
8. Learning loop kicks in — every recommendation logged, every modification captured, the next case is smarter

**This is an ongoing relationship, not a one-time data load.**

## 12. The Learning Loop (Phase 5+)

When an agent is on a call with the team and the engine has recommended a strategy, the human can:
- Walk through the recommendation in real time
- Verify it's correct
- Modify it if needed
- The engine learns from the modification and saves it for next time

**The brain gets smarter with every use. The brain you launch with is the worst brain you'll ever have.**

## 13. The Business Plan (summary)

| Path to $30K MRR | Composition |
|---|---|
| Months 1-3 (build) | $0 MRR. 2-3 design partners free/beta. |
| Months 4-6 (soft launch) | $3K-$6K MRR. 40 individual agents + 1 small IMO. |
| Months 7-9 (public launch) | $10K-$15K MRR. 50 individual agents + 1 small IMO + 1 mid IMO (100 seats). |
| Months 10-12 (scale) | $25K-$35K MRR. 75-100 individual agents + 1 small IMO + 2 mid IMOs. |
| **$30K MRR achieved by month 12** | |

**Year 1 costs:** ~$141K-$392K (investment year)
**Year 2 breakeven:** ~month 18 if milestones hit
**Year 2 profitability:** +$83K to +$383K if a large IMO (500+ seats) lands

**Full P&L:** see the Business Plan doc.

## 14. Architecture Requirements (non-obvious)

- **Periodic tax-code updates** — the engine architecture must support updates as the IRC changes (OBBBA references 2026 are current; the next major change will happen)
- **Strategy library as a controlled vocabulary** — the engine does NOT have access to a general LLM's free-form output. The brain is the source of truth. New strategies go through pre-launch validation before they're available to recommend
- **Compliance filter is a runtime concern, not a doc** — every client-facing output passes through the compliance language filter before delivery
- **Admin actions are auditable** — every grant, revoke, suspend, modify is logged with timestamp and actor
- **The Opportunity Flow with Learning Loop is a first-class feature** — not an afterthought. It's what makes the product defensible over time
- **White-label branding per IMO** — logo, color, byline. The IMO's agents see a branded version of the app
- **Per-seat usage tracking** — which agents are active, which are churning, which are getting value
- **Compliance flag queue** — every output is tagged. The compliance officer clears them in a queue UI

## 15. Source-of-Truth Documents the Dev Will Read

| Doc | What it has |
|---|---|
| **The Brain** | 9 core + 8 supporting strategies, with README, Knowledge Base, Quick Reference Index |
| **"I've got a guy" Intake Flow** (next to build) | 10 conversational questions, avatar classification, recommendation logic, pivot-to-alternative, wholesaler handoff trigger, worked example |
| **Field Underwriting Questionnaire** (next to build) | Life and annuity intake flows |
| **Wholesaler Handoff Template** (next to build) | The illustration request email |
| **Progress Dashboard Math** (next to build) | Commission math, close rate, pipeline value, book-of-business opportunity |
| **Master Dashboard Spec** (next to build) | Every screen, every metric, Opportunity Flow with Learning Loop, Compliance Flag Queue |
| **Pre-Launch Validation Process** (next to build) | Knowledge elicitation workflow |
| **Brand Package** (next to build) | Names, tagline, visual, brand rules |
| **Recruiting Engine Spec** (next to build) | Every marketing asset, channel strategy |
| **Phased Build Plan** | Six phases, batched Copilot sessions, end-of-phase testing |
| **Business Plan & P&L** | Revenue projections, cost lines, breakeven, $30K MRR path |

## 16. What's Open (Decisions Jay Needs to Make)

| # | Decision | Why it matters |
|---|---|---|
| 1 | Agency name | Drives all marketing, the IMO pitch, the website |
| 2 | Software name | Drives the in-product UX, the demo, the sales page |
| 3 | Bot name | Drives the in-product voice, the launch commercial |
| 4 | Bot voice | Adventurer (honest, plain-spoken, calm) or more clipped/tech-forward |
| 5 | Cost assumptions for the P&L | Are you hiring a dev, contracting one, or using a shop? |
| 6 | Compliance officer | Who? When? What cost? |
| 7 | Close rate baseline | Determines the pipeline math |
| 8 | First demo scenario | "Two owners 50/49, two key employees, C-Corp, want buy-sell and COLI reserve" or different? |
| 9 | Killer visual for the iPhone-moment | What single moment in the app experience would make an agent say "I need that"? |
| 10 | Books to upload for the brain | Whenever ready — index and pull out the strategy material |

## 17. Testing Protocol (Non-Negotiable)

At the end of every phase, the dev tests end-to-end before moving to the next phase.

- **Phase 1:** Sign up, pay, log in, see empty dashboard, log out. Test admin actions.
- **Phase 2:** Walk through every screen. Check every piece of copy against the brand rules. Show the marketing site to 3 people outside the build.
- **Phase 3:** Run 5-10 real "I've got a guy" scenarios end-to-end. Verify recommendations, pivots, compliance language, hard rules. Run the pre-launch validation flow on a new strategy.
- **Phase 4:** Run a real agent through a real week. Verify the prospecting list, the call queue, the progress dashboard, the pitch deck.
- **Phase 5:** Run a pilot IMO through the white-label setup, the pricing tiers, the master dashboard, the Opportunity Flow, the learning loop, the compliance queue.
- **Phase 6:** Show the app to 5 agents outside the build. Show the IMO pitch to 3 IMO principals. Get feedback. Iterate.

---

*Last updated: June 30, 2026. This document will be updated as the project evolves.*