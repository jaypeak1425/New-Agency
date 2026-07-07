import { describe, expect, it } from "vitest";
import { strategyLibrarySeed } from "../prisma/strategy-library-data";
import { CONCEPT_LIBRARY, CATEGORY_LABELS } from "../src/lib/concept-library";
import { CLIENT_PITCH } from "../src/lib/pitch-deck-content";
import { complianceFilter } from "../src/lib/compliance-filter";

// The Library's contract (owner directive 2026-07-06): every concept carries
// an internal explanation (the Strategy card — seeded), a client one-pager
// (CLIENT_PITCH), a case study, and the top 10 CPA/client questions.

describe("concept library", () => {
  const seededSlugs = strategyLibrarySeed.map((s) => s.slug as string);

  it("covers every seeded strategy and nothing else", () => {
    for (const slug of seededSlugs) {
      expect(CONCEPT_LIBRARY[slug], `missing Library entry for ${slug}`).toBeDefined();
    }
    for (const slug of Object.keys(CONCEPT_LIBRARY)) {
      expect(seededSlugs, `Library entry for unseeded slug ${slug}`).toContain(slug);
    }
  });

  it("every concept has exactly 10 questions, each with a real answer and asker", () => {
    for (const [slug, entry] of Object.entries(CONCEPT_LIBRARY)) {
      expect(entry.topQuestions, slug).toHaveLength(10);
      for (const question of entry.topQuestions) {
        expect(question.q.length, `${slug} question text`).toBeGreaterThan(5);
        expect(question.a.length, `${slug} answer text`).toBeGreaterThan(20);
        expect(["cpa", "client"]).toContain(question.asker);
      }
      // Both audiences represented — "a CPA or client would ask".
      expect(entry.topQuestions.some((q) => q.asker === "cpa"), `${slug} has CPA questions`).toBe(true);
      expect(entry.topQuestions.some((q) => q.asker === "client"), `${slug} has client questions`).toBe(true);
    }
  });

  it("every concept has a complete case study and a valid category", () => {
    for (const [slug, entry] of Object.entries(CONCEPT_LIBRARY)) {
      expect(entry.caseStudy.title.length, slug).toBeGreaterThan(5);
      expect(entry.caseStudy.situation.length, slug).toBeGreaterThan(50);
      expect(entry.caseStudy.design.length, slug).toBeGreaterThan(50);
      expect(entry.caseStudy.outcome.length, slug).toBeGreaterThan(50);
      expect(CATEGORY_LABELS[entry.category], `${slug} category`).toBeDefined();
    }
  });

  it("every concept's client one-pager source exists and passes the compliance filter", () => {
    for (const slug of Object.keys(CONCEPT_LIBRARY)) {
      const narrative = CLIENT_PITCH[slug];
      expect(narrative, `missing CLIENT_PITCH narrative for ${slug}`).toBeDefined();
      const strings = [
        narrative.clientTitle,
        narrative.approach,
        ...narrative.howItWorks,
        ...narrative.whatToKnow,
      ];
      for (const text of strings) {
        // The one-pager renders through the filter; nothing may HOLD. A
        // rewrite is acceptable (the filter fixes it in place).
        expect(
          complianceFilter(text).status,
          `${slug} one-pager string held: "${text.slice(0, 60)}"`,
        ).not.toBe("hold");
      }
    }
  });
});

describe("sales playbook (docs/31 field layer)", () => {
  it("every playbook entry is complete and keyed to a known slug", async () => {
    const { SALES_PLAYBOOK } = await import("../src/lib/sales-playbook");
    const seededSlugs = strategyLibrarySeed.map((s) => s.slug as string);
    // Growth-log candidates (docs/31): playbook content ships dormant until
    // the strategy enters the Brain via the validation workflow.
    const growthLogCandidates = ["cash-balance-plan", "surety-bonding"];
    for (const [slug, entry] of Object.entries(SALES_PLAYBOOK)) {
      expect(
        [...seededSlugs, ...growthLogCandidates],
        `playbook entry for unknown slug ${slug}`,
      ).toContain(slug);
      expect(entry.whatItIs.length, slug).toBeGreaterThan(30);
      expect(entry.idealClient.length, slug).toBeGreaterThan(20);
      expect(entry.hook.length, slug).toBeGreaterThan(20);
      expect(entry.positioning.length, slug).toBeGreaterThan(20);
      expect(entry.pitch.length, slug).toBeGreaterThan(40);
      expect(entry.objections.length, slug).toBeGreaterThan(0);
      for (const o of entry.objections) {
        expect(o.objection.length, slug).toBeGreaterThan(5);
        expect(o.response.length, slug).toBeGreaterThan(20);
      }
      expect(entry.crossSell.length, slug).toBeGreaterThan(0);
      expect(entry.coi.length, slug).toBeGreaterThan(10);
      // The playbook's own compliance standard: never "tax-free" in a talk track.
      const allText = [entry.whatItIs, entry.hook, entry.positioning, entry.pitch].join(" ");
      expect(allText.toLowerCase().includes("tax-free"), `${slug} says tax-free`).toBe(false);
    }
  });
});
