import { describe, it, expect } from "vitest";
import {
  amtTrapExposure2026,
  computeFederalTax2026,
  marginalRate2026,
  taxRef,
} from "@/lib/tax-reference";
import { buildImprovementAnalysis } from "@/lib/improvement";
import type { Scenario, Strategy } from "@/generated/prisma/client";

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    maritalStatus: null,
    estimatedEstateValue: null,
    estimatedQualifiedBalance: null,
    estimatedTaxableIncome: null,
    primaryGoals: [],
    ...overrides,
  } as unknown as Scenario;
}

const strat = (slug: string) => ({ slug, name: slug }) as unknown as Strategy;

describe("2026 federal tax engine (Rev. Proc. 2025-32)", () => {
  it("computes bracket-boundary tax correctly for single filers", () => {
    // Full 10% bracket exactly.
    expect(computeFederalTax2026(12_400, "single")).toBe(1_240);
    // 10% + 12% brackets exactly: 1,240 + (50,400-12,400)*.12 = 5,800.
    expect(computeFederalTax2026(50_400, "single")).toBe(5_800);
    expect(computeFederalTax2026(0, "single")).toBe(0);
  });

  it("computes MFJ tax at double the single thresholds through 32%", () => {
    expect(computeFederalTax2026(24_800, "mfj")).toBe(2_480);
    expect(computeFederalTax2026(100_800, "mfj")).toBe(11_600);
  });

  it("returns the right marginal rates, including the 37% top", () => {
    expect(marginalRate2026(40_000, "single")).toBe(0.12);
    expect(marginalRate2026(150_000, "mfj")).toBe(0.22);
    expect(marginalRate2026(900_000, "mfj")).toBe(0.37);
    expect(marginalRate2026(700_000, "single")).toBe(0.37);
  });

  it("models the OBBBA AMT trap: 50¢/dollar phase-out above $500K/$1M", () => {
    expect(amtTrapExposure2026(400_000, "single")).toBeNull();
    const single = amtTrapExposure2026(600_000, "single");
    expect(single?.exemptionLost).toBe(50_000); // (600k-500k) * 0.5
    const mfj = amtTrapExposure2026(1_280_400, "mfj");
    expect(mfj?.exemptionLost).toBe(140_200); // fully exhausted
    expect(mfj?.exemptionRemaining).toBe(0);
    expect(amtTrapExposure2026(2_000_000, "mfj")?.exemptionLost).toBe(140_200); // capped
    expect(single?.fullyPhasedOutAt).toBe(680_200);
  });

  it("numeric engine matches the display table's anchors", () => {
    expect(taxRef("ordinary_brackets_single")?.y2026).toContain("$50,400");
    expect(taxRef("ordinary_brackets_mfj")?.y2026).toContain("$100,800");
    expect(taxRef("amt")?.y2026).toContain("$140,200");
  });
});

describe("improvement analysis (agent-only quantified comparison)", () => {
  it("estate family: computes 40% exposure above the exemption (married doubles it)", () => {
    const a = buildImprovementAnalysis(
      scenario({ maritalStatus: "married", estimatedEstateValue: 40_000_000 }),
      strat("survivorship-second-to-die"),
    );
    expect(a.available).toBe(true);
    // 40M - 30M = 10M excess → $4,000,000 at 40%.
    expect(a.currentPath.join(" ")).toContain("$4,000,000");
    expect(a.withDesign.join(" ")).toContain("$4,000,000");
  });

  it("estate family: under the exemption reports no current exposure but flags growth", () => {
    const a = buildImprovementAnalysis(
      scenario({ maritalStatus: "single", estimatedEstateValue: 10_000_000 }),
      strat("ilit-foundation-wrapper"),
    );
    expect(a.available).toBe(true);
    expect(a.currentPath.join(" ")).toContain("no current federal estate exposure");
  });

  it("qualified family: quantifies the 10-year-rule cost at the client's marginal rate", () => {
    const a = buildImprovementAnalysis(
      scenario({
        maritalStatus: "married",
        estimatedQualifiedBalance: 1_000_000,
        estimatedTaxableIncome: 300_000, // 24% MFJ bracket in 2026
      }),
      strat("quiet-wealth-transfer"),
    );
    expect(a.available).toBe(true);
    expect(a.currentPath.join(" ")).toContain("$240,000"); // 1M × 24%
    expect(a.currentPath.join(" ")).toContain("24%");
  });

  it("adds the AMT-trap note when income sits in the phase-out band", () => {
    const a = buildImprovementAnalysis(
      scenario({
        maritalStatus: "married",
        estimatedQualifiedBalance: 1_000_000,
        estimatedTaxableIncome: 1_200_000,
      }),
      strat("roth-plus-life"),
    );
    expect(a.notes.join(" ")).toContain("AMT trap check");
  });

  it("asks for the missing inputs instead of inventing numbers", () => {
    const a = buildImprovementAnalysis(scenario(), strat("quiet-wealth-transfer"));
    expect(a.available).toBe(false);
    expect(a.missingInputs).toEqual([
      "estimated qualified balance",
      "estimated taxable income",
    ]);
  });

  it("stays silent for strategies whose numbers come from illustrations, not federal tables", () => {
    const a = buildImprovementAnalysis(
      scenario({ estimatedTaxableIncome: 400_000 }),
      strat("key-person-life-insurance"),
    );
    expect(a.available).toBe(false);
    expect(a.missingInputs).toEqual([]);
  });
});
