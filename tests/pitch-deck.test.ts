import { describe, it, expect } from "vitest";
import { strategyLibrarySeed } from "../prisma/strategy-library-data";
import { CLIENT_PITCH } from "@/lib/pitch-deck-content";
import { complianceFilter } from "@/lib/compliance-filter";

describe("pitch deck client narratives", () => {
  it("covers every documented strategy in the library", () => {
    const documented = strategyLibrarySeed.filter((s) => s.status === "documented");
    for (const s of documented) {
      expect(CLIENT_PITCH[s.slug], `narrative for ${s.slug}`).toBeDefined();
    }
  });

  it("has no narrative for slugs outside the library (no orphaned client copy)", () => {
    const slugs = new Set(strategyLibrarySeed.map((s) => s.slug));
    for (const slug of Object.keys(CLIENT_PITCH)) {
      expect(slugs.has(slug), `orphan narrative: ${slug}`).toBe(true);
    }
  });

  it("every narrative carries the sell-the-improvement comparison (before/after rows)", () => {
    for (const [slug, narrative] of Object.entries(CLIENT_PITCH)) {
      expect(narrative.beforeAfter.length, `beforeAfter rows for ${slug}`).toBeGreaterThan(0);
      for (const row of narrative.beforeAfter) {
        expect(row.today.length, `today cell for ${slug}`).toBeGreaterThan(20);
        expect(row.after.length, `after cell for ${slug}`).toBeGreaterThan(20);
      }
    }
  });

  it("every narrative string clears the compliance filter without a hold", () => {
    // pass = clean; rewrite = auto-fixable (the builder applies and records
    // the fix); hold would mean IRC/form/structure references, guarantees,
    // or quantified outcomes made it into client copy — never acceptable.
    for (const [slug, narrative] of Object.entries(CLIENT_PITCH)) {
      const strings = [
        narrative.clientTitle,
        narrative.approach,
        ...narrative.howItWorks,
        ...narrative.whatToKnow,
        ...narrative.beforeAfter.flatMap((row) => [row.today, row.after]),
      ];
      for (const text of strings) {
        const result = complianceFilter(text);
        expect(
          result.status,
          `${slug}: "${text.slice(0, 60)}…" → ${JSON.stringify(result.violations)}`,
        ).not.toBe("hold");
      }
    }
  });

  it("client titles are already clean (no rewrite needed on a slide title)", () => {
    for (const [slug, narrative] of Object.entries(CLIENT_PITCH)) {
      expect(complianceFilter(narrative.clientTitle).status, `title for ${slug}`).toBe("pass");
    }
  });
});
