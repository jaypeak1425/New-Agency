# Pre-Launch Validation Process Spec

## Purpose
This is the workflow that turns Jay Peak's brain and Luke Britt's brain into the engine's brain in a defensible, repeatable way. Before any strategy goes live in the brain, the engine interviews the human team about it, asks clarifying questions, requests documentation, and only goes live when the human team signs off.

**This is an ongoing relationship, not a one-time data load.** Every new strategy goes through the same process. Every periodic tax-code update goes through the same process. Every modification the team makes on a call is captured and learned from.

**This doc is what the developer builds against.** It includes the 9-step process, the diagnostic question set, the documentation request types, the human review paths, the brain-level gates, the post-launch monitoring, the periodic update protocol, the worked examples, and the edge cases.

---

## 1. The 9-Step Process

Every new strategy goes through these 9 steps before it goes live. Every periodic update goes through steps 1-6 (or 1-9 if the change is significant).

### Step 1: Strategy Proposed
Anyone on the team (Jay, Luke, a senior producer, or a future team member) proposes a new strategy. The proposal includes:
- Strategy name
- Why this strategy is needed (what client problem it solves)
- Which avatar(s) it serves
- Initial references or source material (the Claude content, a textbook, a CFP module, a real case)
- Whether this is a NEW strategy or an UPDATE to an existing one

**If UPDATE:** The engine pulls the existing strategy card and shows the team what needs to change. Steps 2-6 focus on the change.

**If NEW:** The engine treats this as a fresh knowledge elicitation. Steps 2-9 run in full.

### Step 2: Engine Interviews the Human Team
The engine asks a structured set of 12 diagnostic questions. The human team (typically Jay and/or Luke, or whoever proposed the strategy) answers each one in their own words. The engine parses the answers and asks follow-up questions where the answer is unclear or incomplete.

**The 12 diagnostic questions (the full question set is in Section 2 below):**
1. What's the client problem this strategy solves?
2. What are the eligibility gates — age, health, structure, time, ownership, anything else?
3. What is the funding mechanism — life insurance, annuity, both, or something else?
4. How does this strategy work mechanically, in plain English?
5. What does the pitch order look like? Which strategies pair with this one?
6. What are the common objections, and how are they handled?
7. What is the compliant language used to describe this strategy to a client?
8. If the client doesn't fit this strategy, what is the pivot-to alternative?
9. What roles need to be in the conversation (CPA, attorney, trust professional)?
10. What documentation, illustrations, or templates support this strategy?
11. What is a real "I've got a guy" example that uses this strategy?
12. What are the technical / compliance notes a producer must know before recommending this?

**The interview is conversational.** The engine doesn't dump all 12 questions at once. It asks one, listens, asks a follow-up if needed, then moves on. The interview can take 30-60 minutes for a complex new strategy.

### Step 3: Engine Requests Documentation
Based on the answers, the engine produces a documentation request list. The list is tailored to the strategy. For example, for a buy-sell strategy, the engine might request:
- Sample buy-sell agreement templates (cross-purchase, trusteed cross-purchase, entity purchase)
- Sample permanent life illustrations on survivorship structures
- Sample pitch decks used in real buy-sell cases
- Sample wholesaler handoff emails
- Any 1035 exchange examples (if applicable)
- Compliance language review notes from past cases
- Reference: IRC §101(a), §101(j), §2035, §2042

**The engine has 9 documentation request types** (see Section 3 below).

### Step 4: Human Team Provides Documentation
The human team uploads, links, or describes the materials. The engine indexes each piece of documentation and ties it to the specific fields in the strategy card.

**The engine accepts documentation in any form:**
- Uploaded files (PDFs, PowerPoint, Word, images)
- Pasted text
- Linked URLs (with the engine fetching and indexing the content)
- Real case examples (anonymized — no real client names, real policy numbers, real SSNs)
- Verbal descriptions (the human team dictates or types out)

**If the human team can't provide a specific piece of documentation**, they say so. The engine flags the gap and either:
- Proceeds without it (if the gap is non-critical)
- Holds the strategy for go-live until the gap is filled

### Step 5: Engine Drafts the Strategy Card
The engine produces the strategy in the uniform template (the same template that already exists for the 9 core + 8 supporting strategies). The card includes:
- Concept
- How it works
- Why it exists
- Ideal client
- Trigger events
- Key technical / compliance notes
- Compliance language
- Pivot-to-alternative
- COI action (who needs to be in the conversation)
- "I've got a guy" example
- Video topic (for the video recommender in Phase 4)
- Linked documentation (every piece of supporting material)
- Source citations (the interview, the docs, the references)

**The engine uses a uniform template for every strategy.** Consistency makes the engine's reasoning layer simpler and the strategy library easier to maintain.

### Step 6: Human Team Reviews and Signs Off
The human team (Jay, Luke, or both) reviews the draft card. The review has three possible outcomes:

**Outcome A: Approve as-is**
The card goes to the brain immediately. The strategy is live.

**Outcome B: Request changes**
The human team makes corrections, additions, or modifications. The engine updates the card. The human team reviews again. This loops until approved.

**Outcome C: Reject (rare)**
The strategy is not added. This happens if the human team decides the strategy is too complex, too narrow, or doesn't fit the product positioning. The rejection is logged with a reason.

**Sign-off is recorded as a learning event** (see Master Dashboard Spec). The team member's identity, the action, the timestamp, and any modifications are all captured.

### Step 7: Engine Goes Live with the Strategy
Once approved, the strategy is added to the brain's active library. It is now available for Atlas to recommend. The strategy appears in:
- The strategy selection logic (Section 13 of the original brain)
- The mapping tables (money-source, need)
- The pivot-to-alternative logic (when other strategies don't fit)
- The compliance filter (every output from this strategy is checked)

**The go-live is logged** in the audit log. The strategy's first appearance in a recommendation is timestamped.

### Step 8: Learning Loop Kicks In
From this point forward, every recommendation the engine makes for this strategy is captured. Every time the human team reviews a recommendation on a call and modifies it, the modification is captured. The next time a similar case comes in, the engine applies the modification.

**For new strategies, the first 30 days are a calibration period.** The human team reviews most recommendations for that strategy during this window. By the end of the 30 days, the engine's recommendations for that strategy have converged on the team's actual case-design thinking.

### Step 9: Post-Launch Monitoring
The strategy is monitored for:
- **Recommendation frequency** — how often Atlas recommends this strategy
- **Pivot frequency** — how often the strategy is the recommended alternative when another doesn't fit
- **Modification rate** — how often the human team modifies recommendations for this strategy
- **Compliance flag rate** — how often the strategy's outputs get caught by the compliance filter
- **Close rate (when measurable)** — the actual close rate of scenarios that include this strategy

If the modification rate is high (>30% of recommendations modified), the engine surfaces it: "The QWT strategy has been modified 8 times in the last 30 days. Want to review the strategy card to see if it needs an update?"

---

## 2. The 12 Diagnostic Questions (Full Question Set)

The engine asks these one at a time during Step 2. The full set:

1. **"What's the client problem this strategy solves?"** — Captures the client pain point. The answer is used in the strategy card's "Concept" section and in the marketing copy.

2. **"What are the eligibility gates — age, health, structure, time, ownership, anything else?"** — Captures the eligibility rules. The answer is used in the strategy card's "Ideal client" and "Trigger events" sections, and it feeds the pivot-to-alternative engine.

3. **"What is the funding mechanism — life insurance, annuity, both, or something else?"** — Captures what pays for the strategy. The answer drives the underwriting intake (life or annuity).

4. **"How does this strategy work mechanically, in plain English?"** — Captures the how. The answer is used in the strategy card's "How it works" section. The engine asks for plain English, not jargon.

5. **"What does the pitch order look like? Which strategies pair with this one?"** — Captures the co-strategies. The answer is used in the strategy card's "Often paired with" section and in the recommendation output.

6. **"What are the common objections, and how are they handled?"** — Captures the objections. The answer is used in the agent training and in the COI action surfacing.

7. **"What is the compliant language used to describe this strategy to a client?"** — Captures the compliant vocabulary. The answer is used in the strategy card's "Compliance language" section and feeds the compliance filter.

8. **"If the client doesn't fit this strategy, what is the pivot-to alternative?"** — Captures the alternative. The answer is used in the strategy card's "Pivot-to-alternative" section and feeds the pivot engine.

9. **"What roles need to be in the conversation (CPA, attorney, trust professional)?"** — Captures the COI. The answer is used in the strategy card's "Roles" section and feeds the COI action surfacing.

10. **"What documentation, illustrations, or templates support this strategy?"** — Captures the supporting materials. The answer feeds the documentation request list.

11. **"What is a real 'I've got a guy' example that uses this strategy?"** — Captures a worked example. The answer is used in the strategy card's "'I've got a guy' example" section and in the training materials.

12. **"What are the technical / compliance notes a producer must know before recommending this?"** — Captures the warnings. The answer is used in the strategy card's "Key technical/compliance notes" section and feeds the engine's reasoning layer.

---

## 3. The 9 Documentation Request Types

When the engine requests documentation in Step 3, it picks from these 9 types based on the strategy:

| Type | What it is | Example |
|---|---|---|
| **Strategy templates** | Legal or structural templates | Buy-sell agreement, ILIT trust document, REBA restrictive endorsement |
| **Sample illustrations** | Real illustrations from carriers | Permanent life, survivorship, SPIA, annuity, COLI |
| **Sample pitch decks** | Real decks used in client meetings | Buy-sell pitch, QWT pitch, REBA pitch |
| **Sample wholesaler handoffs** | Real handoff emails | Buy-sell, COLI, QWT |
| **Real case examples** | Anonymized case studies | "I had a client like this, here's what we did" |
| **Compliance language review notes** | Compliance-approved language for client copy | "Use 'non-taxable while the policy remains in force' for this strategy" |
| **Reference materials** | Books, articles, IRS publications, court cases | IRC §101(a), §1035 Rev. Proc. 2011-38 |
| **Calculators** | Existing calculation tools (Jay and Luke's Claude calculators) | Cash balance contribution calculator, QWT bridge calculator |
| **Marketing pieces** | Existing one-pagers, brochures, sales scripts | Buy-sell one-pager, REBA marketing piece |

**The documentation request is a list, not a single item.** The engine produces a complete list of what it needs to validate the strategy.

---

## 4. The 3 Human Review Paths

In Step 6, the human team can take one of three paths:

### Path A: Single-Reviewer Approval (faster)
One person reviews and approves. Used for:
- Updates to existing strategies (small changes)
- New strategies that are well-documented and clearly fit the product positioning
- Strategies proposed by Jay or Luke themselves

**Default approver:** Jay (or Luke, for the strategies in his brain — HNW, survivorship, estate funding, premium financing, GRATs).

### Path B: Two-Reviewer Approval (standard)
Two people review and approve. Used for:
- New strategies that introduce a new compliance or technical consideration
- Updates to existing strategies that change the recommendation logic
- Strategies that touch the 9 hard rules

**Default approvers:** Jay + Luke (or Jay + a senior team member, once the team grows).

### Path C: Three-Reviewer Approval (high-stakes)
Three people review and approve. Used for:
- Strategies involving qualified money repositioning (QWT, Roth conversions, annuity repositioning)
- Strategies that could trigger prohibited transactions (joint LTC from one spouse's IRA, etc.)
- Strategies that introduce new technical mechanisms (e.g., a new type of trust structure)

**Default approvers:** Jay + Luke + compliance officer.

---

## 5. The Brain-Level Gates (Must Pass Before Go-Live)

Before a strategy can go live, it must pass 5 brain-level gates:

### Gate 1: Strategy card is complete
All 12 sections of the uniform template are filled in. No "TBD" or "To be determined" markers.

### Gate 2: Documentation is linked
At least 3 pieces of supporting documentation are linked in the strategy card. For high-stakes strategies, 5+ pieces.

### Gate 3: "I've got a guy" example is included
The strategy card has a worked example showing how it would be recommended in a real scenario.

### Gate 4: Compliance language is reviewed
The compliance officer has reviewed the strategy's client-facing language and signed off.

### Gate 5: Hard rules compliance
The engine has verified that the strategy does not violate any of the 9 hard rules (no direct annuity-to-life §1035, etc.). The verification is automated and logged.

**If any gate fails, the strategy does not go live.** The engine surfaces the failing gate to the human team and the gap must be filled.

---

## 6. The Periodic Tax-Code Update Protocol

The IRC changes. The OBBBA 2026 references in the current brain are current today, but they'll need to be updated when the next major tax law passes. The protocol:

### Trigger
Any of the following triggers a periodic update review:
- A new federal tax law passes (annual review minimum)
- An IRS notice or revenue procedure changes the rules
- A court case changes the interpretation of a relevant IRC section
- A new state-level tax law affects the strategy
- The compliance officer flags a concern

### Process
The update goes through Steps 1-6 of the standard validation process. If the change is small (e.g., an exemption amount update), Step 6 is a single-reviewer approval. If the change is large (e.g., a new §1035 ruling, a new prohibited transaction), Step 6 is a three-reviewer approval.

### Frequency
At minimum, an annual review of the entire strategy library. The engine surfaces: "It's been 365 days since the last tax-code review. The following strategies may need an update: [list]. Want to schedule the review?"

---

## 7. Worked Examples (5 Examples Showing the Process in Action)

### Example 1: Adding a New Buy-Sell Variant (e.g., Trusteed Cross-Purchase)
This is an UPDATE to an existing strategy. Steps 1-6 run focused on the change. The human team adds the trust mechanism, the documentation request pulls sample trusteed cross-purchase templates, and the strategy card is updated to include the new variant. Single-reviewer approval (Jay). Live within a week.

### Example 2: Adding a New Strategy (e.g., Deferred Compensation Plan)
This is a NEW strategy. Steps 1-9 run in full. The engine interviews Jay (and Luke, depending on the strategy) about the deferred comp structure, the eligibility gates, the funding mechanism, the pitch order, the compliant language, and a worked example. Documentation includes sample plan documents, sample illustrations, sample pitch decks, and reference to the relevant IRC section. Two-reviewer approval (Jay + Luke). Live within 2-3 weeks.

### Example 3: Updating QWT for a New IRS Ruling
This is a tax-code UPDATE. The trigger is a new IRS notice. Steps 1-6 run focused on the change. The engine pulls the existing QWT card, the human team reviews the change, the documentation is the new ruling itself, the strategy card is updated. Three-reviewer approval (Jay + Luke + compliance officer). Live within days.

### Example 4: Adding a COI for an Existing Strategy (e.g., Buy-Sell Now Surfaces the Trust Attorney)
This is a small UPDATE. The engine pulls the existing buy-sell card, the human team adds the trust attorney COI action to the roles section, the documentation is a sample attorney engagement letter and a sample trust document. Single-reviewer approval (Jay). Live within days.

### Example 5: Rejecting a Proposed Strategy (e.g., a Viatical Settlement Strategy)
The team proposes adding a viatical settlement strategy. The engine interviews the human team. The interview reveals significant compliance concerns (viatical settlements are heavily regulated, often used in questionable ways, and don't fit the product's "diagnosis-first" positioning). The human team rejects the strategy in Step 6. The rejection is logged with the reason. The strategy is not added.

---

## 8. Edge Cases

**Edge case 1: The human team disagrees on the strategy card.**
Path B (two-reviewer approval) handles most cases. If Jay and Luke fundamentally disagree, the strategy is held for a third-reviewer escalation. The compliance officer is the tiebreaker.

**Edge case 2: The documentation the human team provides is incomplete or inconsistent.**
The engine surfaces the gap or conflict: "The sample illustration shows $50K annual premium, but the documentation says $78K. Which is correct?" The human team resolves. The strategy card is updated.

**Edge case 3: A strategy needs to be deprecated.**
The human team flags the strategy for deprecation. The engine removes it from the active library but keeps it in an "archive" for reference. Atlas no longer recommends it. The deprecation is logged with the reason.

**Edge case 4: A periodic tax-code update affects multiple strategies.**
The engine identifies all the affected strategies, produces an update plan, and the human team works through them in a batch. The batch is logged as a single review event.

---

## 9. What the Dev Builds Against This Doc

- **A 9-step state machine** for the validation process
- **A 12-question diagnostic interview engine**
- **A documentation request generator** (picks from the 9 types)
- **A documentation indexer** (accepts uploads, pasted text, links, descriptions)
- **A strategy card template** (the uniform structure)
- **A review workflow** (3 paths: single, dual, triple reviewer)
- **The 5 brain-level gates** (each one is a check before go-live)
- **A periodic tax-code update protocol** (annual review trigger, change-detection logic)
- **A learning event log** for every review action
- **A deprecation workflow** for retiring strategies
- **A conflict resolution flow** for disagreements

**All actions are auditable.** The pre-launch validation log is the substrate for the brain's evolution. Every go-live, every rejection, every modification is captured.

---

*Last updated: June 30, 2026. Default reviewers: Jay (Path A), Jay + Luke (Path B), Jay + Luke + compliance officer (Path C). Default brain-level gates: 5. Default documentation minimum: 3 pieces per strategy. All other assumptions marked in the build status doc.*
