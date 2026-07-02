import { describe, it, expect } from "vitest";
import { strategyLibrarySeed } from "../prisma/strategy-library-data";
import { CPA_SCRUTINY, TIER_LABELS } from "@/lib/cpa-scrutiny";
import { TAX_REFERENCE, taxRef } from "@/lib/tax-reference";
import { buildHandoffContent } from "@/lib/handoff";
import type { Scenario, Strategy, User } from "@/generated/prisma/client";

describe("CPA scrutiny layer", () => {
  it("covers every strategy in the library, with no orphans", () => {
    const slugs = new Set(strategyLibrarySeed.map((s) => s.slug));
    for (const s of strategyLibrarySeed) {
      expect(CPA_SCRUTINY[s.slug], `scrutiny entry for ${s.slug}`).toBeDefined();
    }
    for (const slug of Object.keys(CPA_SCRUTINY)) {
      expect(slugs.has(slug), `orphan scrutiny entry: ${slug}`).toBe(true);
    }
  });

  it("every entry has a valid tier, a verdict, and a non-empty checklist", () => {
    for (const [slug, entry] of Object.entries(CPA_SCRUTINY)) {
      expect([1, 2, 3], `tier for ${slug}`).toContain(entry.tier);
      expect(TIER_LABELS[entry.tier]).toBeTruthy();
      expect(entry.verdict.length, `verdict for ${slug}`).toBeGreaterThan(20);
      expect(entry.checklist.length, `checklist for ${slug}`).toBeGreaterThan(0);
    }
  });

  it("every taxRefKey resolves to a real tax-reference entry", () => {
    for (const [slug, entry] of Object.entries(CPA_SCRUTINY)) {
      for (const key of entry.taxRefKeys) {
        expect(taxRef(key), `${slug} references unknown tax figure "${key}"`).toBeDefined();
      }
    }
  });

  it("the known audit battlegrounds are tier 3 and the black-letter designs are tier 1", () => {
    expect(CPA_SCRUTINY["flp-fllc-discounted-gifting"].tier).toBe(3);
    expect(CPA_SCRUTINY["installment-sale-idgt"].tier).toBe(3);
    expect(CPA_SCRUTINY["ppli"].tier).toBe(3);
    expect(CPA_SCRUTINY["rmd-repositioning"].tier).toBe(1);
    expect(CPA_SCRUTINY["key-person-life-insurance"].tier).toBe(1);
    expect(CPA_SCRUTINY["family-income-legacy"].tier).toBe(1);
  });
});

describe("wholesaler handoff CPA-readiness section", () => {
  it("carries the tier verdict and checklist for the primary strategy stack", () => {
    const scenario = {
      primaryAge: 74,
      healthRating: null,
      healthNotes: null,
      tobaccoUse: null,
      tobaccoNotes: null,
      businessOwnerStatus: null,
      primaryGoals: ["legacy"],
      goalsNotes: null,
      existingRelationship: null,
    } as unknown as Scenario;
    const strategy = {
      slug: "rmd-repositioning",
      name: "RMD Repositioning",
    } as unknown as Strategy;
    const agent = { name: "Test Agent", email: "agent@example.com" } as unknown as User;

    const content = buildHandoffContent(
      scenario,
      { activated: [], needsMoreInfo: [], amtTrapFlag: false, amtTrapNote: null } as never,
      [strategy],
      null,
      null,
      agent,
    );

    expect(content.documentationLines[0]).toContain("RMD Repositioning");
    expect(content.documentationLines[0]).toContain(TIER_LABELS[1]);
    expect(
      content.documentationLines.some((l) => l.includes("RMD calculation confirmed")),
    ).toBe(true);
  });
});

describe("federal tax reference (2026/2027)", () => {
  it("every entry has both year columns and a source", () => {
    for (const entry of TAX_REFERENCE) {
      expect(entry.y2026.length, `2026 value for ${entry.key}`).toBeGreaterThan(0);
      expect(entry.y2027.length, `2027 value for ${entry.key}`).toBeGreaterThan(0);
      expect(entry.source.length, `source for ${entry.key}`).toBeGreaterThan(0);
    }
  });

  it("carries the verified 2026 anchors (Rev. Proc. 2025-32)", () => {
    expect(taxRef("estate_gift_gst_exemption")?.y2026).toBe("$15,000,000");
    expect(taxRef("annual_gift_exclusion")?.y2026).toContain("$19,000");
    expect(taxRef("ltc_per_diem")?.y2026).toBe("$430/day");
    expect(taxRef("standard_deduction")?.y2026).toContain("$32,200");
    expect(taxRef("ordinary_brackets_single")?.y2026).toContain("$640,600");
    expect(taxRef("ordinary_brackets_mfj")?.y2026).toContain("$768,700");
    expect(taxRef("amt")?.y2026).toContain("$500,000");
  });

  it("is honest about 2027: pending where unpublished, law-locked where locked", () => {
    expect(taxRef("annual_gift_exclusion")?.y2027).toContain("Pending");
    expect(taxRef("niit")?.y2027).toContain("Unchanged");
    expect(taxRef("corporate_rate")?.y2027).toContain("21%");
    expect(taxRef("rmd_age")?.y2027).toContain("73");
  });
});
