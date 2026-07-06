Final Handoff Document
Insurance Strategy Engine — Complete Package

1. Handoff at a Glance

What we built: A complete, shareable spec for a Jarvis-style AI strategy engine for life insurance and annuity producers. The product is a SaaS with three-position positioning (recruiting / retention / revenue) priced at $297/mo for individual agents and $75/seat/month for IMO white-label, targeting $30K MRR by month 12.

What's in the package: 12 documents totaling ~30,000 words. Every doc is written so a developer, compliance officer, sales hire, or co-founder can read it and know what to do.

The build is ready to start. Jay has a developer or is hiring one. The developer reads the Master Developer Brief first, then the rest in order. The phased plan takes them from "empty repo" to "$30K MRR product" in 6 phases over ~12 months.

2. Reading Order for the Dev (12 Docs)

1. Master Developer Brief (/home/personal-2056a7e9/docs/insurance-strategy-engine-master-developer-brief-mr182fzk) — the consolidation doc, read first
2. Phased Build Plan (/home/personal-2056a7e9/docs/phased-build-plan-insurance-strategy-engine-mr17onmg) — 6 phases, batched Copilot sessions
3. Business Plan & P&L (/home/personal-2056a7e9/docs/insurance-strategy-engine-business-plan-launch-plan-to-30k-mrr-mr17sxnk) — the math, the path, the breakeven
4. Product Build Status (working index) (/home/personal-2056a7e9/docs/insurance-strategy-engine-product-build-status-june-30-2026-mr17be29) — the index, the queue, the open questions
5. "I've Got a Guy" Intake Flow — the conversation layer (agent ↔ brain)
6. Field Underwriting Questionnaire (Life + Annuity) — the data layer
7. Wholesaler Handoff Template — the illustration request email
8. Progress Dashboard Math — the agent's dashboard math
9. Master Dashboard Spec — the team / IMO command center
10. Pre-Launch Validation Process Spec — the brain's knowledge elicitation workflow
11. Recruiting Engine Spec — the marketing system
12. Final Handoff Document — this doc

Brain (separate, ingested during Phase 3): the canonical strategy library, with README, Knowledge Base, and Quick Reference Index. Provided in the source conversation.

3. The 3 Decisions Jay Needs to Make Before the Dev Starts Phase 1

| Decision | Default I'm using | What to do |
|---|---|---|
| Agency name | Peakbritt Financial Group placeholder | Lock the name. Use find-and-replace across the docs. |
| Software name | Case Atlas placeholder | Lock the name. Use find-and-replace across the docs. |
| Bot name | Atlas (locked) | No action needed. ✓ |

My recommended picks if Jay wants them:
• Agency: Peakbritt Financial Group
• Software: Case Atlas (pairs with the bot name Atlas — "I asked Atlas" inside Case Atlas has nice symmetry)
• Bot: Atlas ✓ (locked)

If Jay wants different names: that's fine. Find-and-replace works.

4. The Dev's First Week Checklist

Before writing any code, the dev should:

• [ ] Read the Master Developer Brief end to end
• [ ] Read the Phased Build Plan end to end
• [ ] Read the Business Plan to understand the unit economics
• [ ] Confirm with Jay: hosting, database, AI backend choice (OpenAI / Anthropic / open-source)
• [ ] Confirm with Jay: the three decisions above (names, defaults)
• [ ] Set up the GitHub repo, the staging environment, the CI/CD pipeline
• [ ] Begin Phase 1, Session 1: scaffold the Next.js app, set up the database schema, deploy to staging

The first commit is "Hello world on staging." The dev is unblocked the moment the staging URL is live.

5. The Launch Checklist (Months 1-12)

Months 1-3 (Pre-Launch / The Build):
• [ ] Phase 1 (Skeleton) complete
• [ ] Phase 2 (Brand) complete
• [ ] Phase 3 (Brain) complete with 5-10 real "I've got a guy" scenarios tested
• [ ] 2 design partners recruited (1 mid IMO + 1 small IMO + 10-20 individual agents)
• [ ] Design partners onboarded with free / beta access
• [ ] The Recruiting Engine assets drafted (one-pagers, decks, demo video, email sequence)

Months 4-6 (Soft Launch):
• [ ] Phase 4 (Output) complete
• [ ] First 50 paying individual agents signed up
• [ ] 1 design partner IMO converted to paid
• [ ] The soap-opera email sequence running
• [ ] 1 industry event attended
• [ ] 3 case studies captured from design partners
• [ ] $3K-$6K MRR achieved

Months 7-9 (Public Launch):
• [ ] Phase 5 (Operations) complete
• [ ] Dream 100 IMO outreach begun
• [ ] First mid-size IMO contract signed
• [ ] Launch commercial produced and distributed
• [ ] Paid ad budget active ($2K-$5K/month)
• [ ] $10K-$15K MRR achieved

Months 10-12 (Scale):
• [ ] Phase 6 (Polish) complete
• [ ] Second mid-size IMO contract signed
• [ ] IMO pitch deck refined from real pilot learnings
• [ ] 1 sales hire added
• [ ] $25K-$35K MRR achieved

6. The Open Questions (Jay and Luke)

These are the things that need answering before the brain goes fully live, organized by who should answer them:

Jay (Your Brain)

| # | Question | Why it matters |
|---|---|---|
| 1 | For each of your 5 core strategies (QWT, RMD Repositioning, Roth+Life, Annuity Rescue, Qualified LTC), confirm the worked example in the Pre-Launch Validation Process doc | Validates your brain's thinking before the engine goes live |
| 2 | Confirm the default close rate (40% existing, 25% new first meeting) is right for your experience | Affects the pipeline math |
| 3 | Confirm the default book addressable filter (15%) is right for your typical sales cycle | Affects the book-of-business opportunity number |
| 4 | Confirm the COI action surfacing pattern is right ("Here's a script to start a CPA relationship") | Affects how the engine helps agents build COI relationships |
| 5 | For the first design partner IMO, who is it and what's the pilot offer? | Affects the launch timeline |

Luke (Luke's Brain)

| # | Question | Why it matters |
|---|---|---|
| 1 | For each of your core strategies (Survivorship, Estate Funding, Premium Financing, GRATs), run the pre-launch validation process | Validates your brain's thinking before the engine goes live |
| 2 | Confirm the trust / ILIT workflow is right (the trustee, the Crummey notices, the §2035 timing) | Affects the COI action for the highest-value strategies |
| 3 | Confirm the estate liquidity math (the "estate rich but cash poor" framing) is right | Affects the strategy card for Estate Funding |

Joint

| # | Question | Why it matters |
|---|---|---|
| 1 | Who is the compliance officer? When do they start? What are their hours / pay? | Affects the Phase 5 compliance queue staffing |
| 2 | What's the dev's contract structure? Hourly? Milestone? Equity? | Affects the P&L |
| 3 | What's the marketing budget for the first 6 months? | Affects the launch playbook |

7. The 3 Things That Aren't Built Yet (and Need to Be)

1. The Brain Content in the Engine's Database
The 9 core + 8 supporting strategies are documented, but they need to be ingested into the engine's actual database. This happens in Phase 3, Session 1. The dev reads the brain doc, structures it as JSON or a relational schema, and seeds the database. The Pre-Launch Validation Process runs on the first 3-5 strategies as a pilot.

2. The Compliance Officer Relationship
The compliance review pipeline is designed, but the actual person hasn't been hired (or contracted). This is an action item for Jay, not a build item for the dev. Recommended approach: contract a part-time insurance compliance consultant in the first 90 days, full-time by month 6 once the product has users.

3. The Real "I've Got a Guy" Examples
The intake flow uses one worked example (the two-owner C-Corp). For a real launch, the engine needs 10-15 worked examples spanning the core strategies. These come from Jay and Luke's actual case files (anonymized). This is an action item for Jay, not a build item.

8. The One Personal Note to the Future Dev

You're building a category-of-one product. The insurance industry is 10-15 years behind marketing in adopting AI tools and software-driven retention. Nothing like this exists in the insurance business today. The moat is the brain, and the brain gets smarter with every use.

The compliance guardrails are not optional. The 9 hard rules (no direct annuity-to-life §1035, etc.) are non-negotiable. The compliance language standards ("non-taxable" not "tax-free," "while the policy remains in force") are baked into every client-facing output. The brain lock (the engine can ONLY recommend from the locked strategy library) is the regulatory defense.

If you ever feel like you're about to invent a new strategy, stop. The engine doesn't invent. The engine reasons from the locked library. New strategies go through the pre-launch validation process before they go live.

If you ever feel like you're about to ship a piece of marketing with a guarantee or a specific income claim, stop. The brand promise is "look at the opportunities in your book." Not "we'll make you rich." The promise is defensible because it's based on the agent's own data.

If you ever feel like the Learning Loop is "nice to have," it isn't. It's what makes the product defensible over time. Every review the team does on a call, every modification, every flag — that data makes the next case better. The brain you ship in month 1 is the worst brain you'll ever have.

Build well. Build with the guardrails. Build the loop. The product will sell itself once an agent experiences it.

— Built by Chief of Staff for Jay Peak, June 30, 2026

9. Where to Go From Here

If you're Jay:
1. Lock the names (or use the placeholders)
2. Hire or contract a developer
3. Hand the developer the Master Developer Brief and the Phased Build Plan
4. Stay involved in the pre-launch validation process for the first 3-5 strategies
5. Hire or contract a compliance officer
6. Build the recruiting engine assets (the marketing package, after the names are locked)
7. Show up at the first industry event with the demo video playing on a loop
8. Get the first case study. Get the second. Get the third.
9. The Dream 100 IMO outreach begins in month 7.
10. $30K MRR by month 12. $70K+ by month 18.

If you're the developer:
1. Read the Master Developer Brief first
2. Then the Phased Build Plan
3. Then the rest in order
4. Confirm the technical decisions with Jay (hosting, database, AI backend)
5. Build Phase 1, Session 1
6. Test end-to-end at the end of every phase
7. Build the loop. The brain gets smarter with every use.

If you're the compliance officer:
1. Read the Master Developer Brief (especially the compliance language standards and the 9 hard rules)
2. Read the Pre-Launch Validation Process Spec
3. Be ready to review every new strategy before it goes live
4. Be ready to clear the Compliance Flag Queue
5. Help Jay run the pre-launch validation interviews for the first 5 strategies

If you're a sales hire (future):
1. Read the Recruiting Engine Spec
2. Read the IMO pitch deck (when it's built)
3. Read the Dream 100 list (when it's built)
4. The IMO sales motion is B2B, not B2C. The buyer is the principal. The pitch is "category of one, retention tool, recruiting tool, revenue tool."

10. The Final Handoff (In One Sentence)

The 12 documents in your library, read in order, are the complete spec for a category-of-one product. The developer can start building today. The brain gets smarter with every use. The brand stays elegant, rich, and defensible. The compliance guardrails hold. The path to $30K MRR is mapped. The rest is execution.

— End of handoff —

Last updated: June 30, 2026. Operational layer complete. Marketing package pending name lock. Default reviewers: Jay (single), Jay + Luke (dual), Jay + Luke + compliance officer (triple). All other assumptions marked in the build status doc.