import { prisma } from "@/lib/prisma";
import { complianceFilter } from "@/lib/compliance-filter";
import { CLIENT_PITCH } from "@/lib/pitch-deck-content";
import { recommendStrategies } from "@/lib/recommendations";
import { getLifeUnderwritingIntake } from "@/lib/underwriting";
import type { Scenario, Strategy, User } from "@/generated/prisma/client";

// The prospect pitch deck (Phase 4 Session 1's deliverable, buildable now
// that the library is live and the compliance filter exists). Three-layer
// guardrail applied end to end:
//  - Brain Lock: decks exist only for documented strategies that the
//    recommendation engine currently marks ELIGIBLE for this scenario —
//    an agent can't deck a strategy Atlas wouldn't recommend.
//  - Content lock: slide copy comes only from src/lib/pitch-deck-content.ts
//    (hand-written client-safe narratives) plus structured scenario facts —
//    never from the agent-facing cards (those cite IRC sections and
//    structure names banned in client copy) and never AI-generated.
//  - Compliance filter: EVERY string on every slide runs through
//    complianceFilter. Auto-fixable issues are rewritten in place and
//    recorded; any non-fixable violation holds the whole deck and files a
//    ComplianceFlag for the admin queue instead of shipping.

export interface DeckSlide {
  title: string;
  paragraphs: string[];
  bullets: string[];
}

export type PitchDeckResult =
  | {
      ready: true;
      slides: DeckSlide[];
      strategy: Strategy;
      clientTitle: string;
      fixesApplied: string[];
    }
  | { ready: false; reason: string; strategy: Strategy | null };

const GOAL_LABELS: Record<string, string> = {
  retirement_income: "dependable retirement income",
  business_continuity: "keeping the business running no matter what",
  key_employee_retention: "holding on to the people who make the business work",
  estate_planning: "settling the estate on your terms",
  legacy: "leaving something meaningful to the family",
  minimize_estate_tax: "keeping estate costs from eroding what passes on",
  charitable_intent: "supporting the causes that matter to you",
  estate_liquidity: "making sure the estate has cash when it needs it",
  other: "the goals we discussed",
};

function situationParagraphs(scenario: Scenario): string[] {
  const paragraphs: string[] = [];

  const facts: string[] = [];
  if (scenario.primaryAge !== null) facts.push(`age ${scenario.primaryAge}`);
  if (scenario.businessOwnerStatus === "business_owner") facts.push("a business owner");
  if (scenario.maritalStatus === "married") facts.push("married");
  if (scenario.hasDependentsUnder18 === true) facts.push("with children still at home");
  if (facts.length > 0) {
    paragraphs.push(`This conversation is designed around where you are today: ${facts.join(", ")}.`);
  }

  const goals = scenario.primaryGoals.map((g) => GOAL_LABELS[g]).filter(Boolean);
  if (goals.length > 0) {
    paragraphs.push(`What you told us matters most: ${goals.join("; ")}.`);
  }

  paragraphs.push(
    "Nothing here is one-size-fits-all — this outline exists so we can pressure-test it together, with your other advisors in the room.",
  );
  return paragraphs;
}

// Runs one string through the compliance filter. Auto-fixable issues come
// back rewritten; a non-fixable violation returns null (deck-level hold).
function filterString(
  text: string,
  fixes: string[],
  holds: string[],
): string | null {
  const result = complianceFilter(text);
  if (result.status === "pass") return text;
  if (result.status === "rewrite") {
    for (const v of result.violations) fixes.push(`${v.type}: "${v.match}"`);
    return result.output;
  }
  for (const v of result.violations) holds.push(`${v.type}: "${v.match}"`);
  return null;
}

export async function buildPitchDeck(
  user: User,
  scenarioId: string,
  strategyId: string,
): Promise<PitchDeckResult> {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario || scenario.userId !== user.id) {
    return { ready: false, reason: "Case not found.", strategy: null };
  }

  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy || strategy.status !== "documented") {
    return { ready: false, reason: "That strategy isn't live in the library.", strategy: null };
  }

  // Brain Lock: the deck follows the engine, never leads it.
  const lifeUnderwritingIntake = await getLifeUnderwritingIntake(user.id, scenarioId);
  const { recommendations } = await recommendStrategies(scenario, lifeUnderwritingIntake);
  const eligible = recommendations.some(
    (r) => r.strategy.id === strategyId && r.eligibility === "eligible",
  );
  if (!eligible) {
    return {
      ready: false,
      reason:
        "Atlas doesn't currently recommend this strategy for this case — complete more of the intake, or pick one of the recommended strategies.",
      strategy,
    };
  }

  const narrative = CLIENT_PITCH[strategy.slug];
  if (!narrative) {
    return {
      ready: false,
      reason:
        "No client-approved narrative exists for this strategy yet — the deck never improvises client copy.",
      strategy,
    };
  }

  const agentName = user.name ?? user.email;
  const rawSlides: DeckSlide[] = [
    {
      title: narrative.clientTitle,
      paragraphs: [
        `Prepared for the ${scenario.label} conversation.`,
        `Presented by ${agentName} — Peakbritt Financial Group.`,
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      ],
      bullets: [],
    },
    { title: "Where you stand", paragraphs: situationParagraphs(scenario), bullets: [] },
    { title: "The approach", paragraphs: [narrative.approach], bullets: [] },
    { title: "How it works", paragraphs: [], bullets: narrative.howItWorks },
    {
      title: "What to keep in mind",
      paragraphs: [],
      bullets: [
        ...narrative.whatToKnow,
        "This overview is educational, not tax or legal advice — your attorney and tax advisor are part of the design team.",
        "All coverage is subject to underwriting and to the terms of the policy as issued.",
      ],
    },
    {
      title: "Next steps",
      paragraphs: [],
      bullets: [
        "Walk through the questions this raises — every good plan survives cross-examination.",
        "A preliminary underwriting conversation, so the design is priced on facts rather than hopes.",
        "A working session with your attorney and tax advisor to fit this into the rest of your plan.",
      ],
    },
  ];

  const fixes: string[] = [];
  const holds: string[] = [];
  const slides: DeckSlide[] = [];
  for (const slide of rawSlides) {
    const title = filterString(slide.title, fixes, holds);
    const paragraphs = slide.paragraphs.map((p) => filterString(p, fixes, holds));
    const bullets = slide.bullets.map((b) => filterString(b, fixes, holds));
    if (title === null || paragraphs.includes(null) || bullets.includes(null)) continue;
    slides.push({
      title,
      paragraphs: paragraphs as string[],
      bullets: bullets as string[],
    });
  }

  if (holds.length > 0) {
    // Non-fixable client-copy violation: the deck does NOT ship. File it for
    // the admin compliance queue with the exact matches.
    await prisma.complianceFlag.create({
      data: {
        triggerType: "filter_caught",
        content: `Pitch deck for "${strategy.name}" held by the compliance filter: ${holds.join("; ")}`,
        scenarioId: scenario.id,
        strategyId: strategy.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "scenario.pitch_deck_held",
        target: scenario.id,
        metadata: { strategySlug: strategy.slug, holds },
      },
    });
    return {
      ready: false,
      reason:
        "The compliance filter held this deck for review — an admin will see it in the compliance queue. Nothing was shown to the client.",
      strategy,
    };
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "scenario.pitch_deck_generated",
      target: scenario.id,
      metadata: { strategySlug: strategy.slug, slideCount: slides.length, fixesApplied: fixes },
    },
  });

  return { ready: true, slides, strategy, clientTitle: narrative.clientTitle, fixesApplied: fixes };
}
