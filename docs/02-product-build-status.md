# Insurance Strategy Engine — Product Build Status

## Purpose
This document is a working index of everything we have built, decided, and saved during the strategy engine build. It exists so that you, Luke, a compliance officer, and a developer can see the full picture in one place.

---

## 1. What is locked (do not re-litigate)

### Product spec
- **4-layer engine:**
  1. The "I've got a guy" intake + strategy recommender
  2. The pitch deck and marketing auto-generator
  3. The strategy library (the brain)
  4. The video recommender (Netflix-for-case-design)
- **4 supporting layers:**
  5. Agent onboarding and customization (voice vs. type, PDF vs. deck, etc.)
  6. Avatar matching (HNW / Business Owner / Qualified Fund Heavy / Family-Legacy)
  7. Prospecting list + per-prospect pitch deck + weekly call queue
  8. Progress tracker + revenue dashboard (commission math, close rate, pipeline value)

### Guardrail system
- **Layer 1 — Compliance engine:** "non-taxable" not "tax-free," condition all benefit claims with "while the policy remains in force," no outcome quantification, no IRS form numbers in client copy, frame as approach not product sale.
- **Layer 2 — Brain lock:** engine can ONLY recommend from the locked strategy library. No AI invention.
- **Layer 3 — Client profile filter:** engine checks age, health, structure, time horizon, ownership % before recommending. Pivot-to-alternative when primary doesn't fit.

### The brain (saved to team memory)
- 9 core strategies + 8 supporting/adjacent strategies
- Cross-cutting technical rules (§1035, qualified rollover, transfer, MEC, qualification, distribution codes, employer-owned, qualified plan limits, estate context)
- 2 mapping tables (money-source, need) as the engine's recommendation layer
- 8 standing principles as the engine's reasoning constraints
- Compliance language standards baked in
- 2026 OBBBA references current
- Architecture supports periodic tax-code updates

### Avatars and product universe
- 4 avatars: HNW (Luke's brain), Business Owner (Jay + Luke), Qualified Fund Heavy (Jay's brain), Family/Legacy (Jay's brain)
- 2-product universe: life insurance (fully underwritten) + annuity (financially underwritten)

### Go-to-market
- v1: Direct-to-agent at $297/month, marketing IS the demo
- v2: White-label distribution to IMOs/FMOs/BGAs (per-seat monthly fee)
- Brand vibe: "we're already living in 2030 and you're not" (iPhone launch energy)

### 9 non-negotiable hard rules
1. Direct annuity-to-life §1035 exchange is NEVER valid — must route through SPIA income funding premiums
2. §1035 is for non-qualified contracts only — qualified money uses rollover/transfer rules
3. Life-to-life §1035 requires same insured, same owner
4. ILIT must be original owner to avoid 3-year lookback §2035
5. COLI requires §101(j) notice and consent before issue
6. MEC status is irrevocable once triggered
7. §162 executive bonus must qualify as reasonable compensation
8. Spouse IRA cannot fund joint LTC benefits — prohibited transaction
9. §415(b) limits apply to life insurance inside qualified plans

---

## 2. Build queue (in order)

| # | Artifact | Status | Doc location |
|---|---|---|---|
| 1 | Strategy Library (the brain) | ✅ LOCKED — saved to team memory | This conversation, also saved in Claude share |
| 2 | "I've got a guy" intake flow | ⏳ NEXT TO BUILD | — |
| 3 | Field underwriting questionnaire (life + annuity) | ⏳ pending | — |
| 4 | Wholesaler handoff template | ⏳ pending | — |
| 5 | Progress dashboard math (commission, close rate, pipeline) | ⏳ pending | — |
| 6 | Brand name and tagline (3 directions for Jay to react to) | ⏳ pending | — |
| 7 | Launch commercial script (60–90s, demo-first) | ⏳ pending — needs brand locked first | — |
| 8 | Sales page copy (long-form) | ⏳ pending — needs brand locked first | — |
| 9 | 5–7 email soap-opera sequence for stuck producers | ⏳ pending — needs Attractive Character voice confirmed | — |
| 10 | IMO white-label one-pager | ⏳ pending | — |
| 11 | Dream 100 of IMO/FMO/BGA principals | ⏳ pending | — |
| 12 | Compliance officer onboarded to review all outputs | ⏳ ACTION NEEDED — not in our control | — |
| 13 | Master developer brief (one shareable artifact) | ⏳ pending — final consolidation | — |

---

## 3. Open questions for Jay

| # | Question | Why it matters |
|---|---|---|
| 1 | Bot voice — Adventurer (honest, plain-spoken, calm) or more clipped/tech-forward? | Affects every conversational output |
| 2 | Brand name and tagline gut reaction | Anchors all marketing |
| 3 | First demo scenario for the launch commercial — "two owners 50/49, two key employees, C-Corp, want buy-sell and COLI reserve" or a different one? | Determines the launch creative |
| 4 | Killer visual for the iPhone-moment — what single moment in the app experience would make an agent say "I need that"? | Anchors the brand and the demo |
| 5 | Close rate baseline for the dashboard | Determines the pipeline math |
| 6 | Per-seat pricing for the white-label IMO model | Determines IMO pitch economics |

---

## 4. What I'd build next (if Jay says go)

**The "I've got a guy" intake flow doc.** This is the conversation layer between the agent (human) and the brain (the 17-strategy library). It would include:

1. The 10 conversational questions in the bot's voice
2. The avatar classification step (which of the 4 avatars does this prospect match)
3. The strategy recommendation (drawing from Part 5's mapping tables)
4. The pivot-to-alternative logic
5. The wholesaler handoff trigger
6. A worked example using the "two owners 50/49, two key employees, C-Corp, want buy-sell and COLI reserve" scenario

---

## 5. Source documents

- The brain (canonical, with README + Knowledge Base + Quick Reference Index) — provided in chat
- Compliance language standards — saved to team memory
- Hard rules — saved to team memory
- Product spec — captured in this conversation
- 4 avatars + 2-product universe — captured in this conversation

---

*Last updated: June 30, 2026. This document will be updated as each artifact is completed.*