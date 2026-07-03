import { describe, it, expect } from "vitest";
import { buildHandoffContent } from "@/lib/handoff";
import type { AvatarClassification } from "@/lib/avatars";
import type { Scenario, Strategy, User } from "@/generated/prisma/client";

// The wholesaler handoff now carries the primary strategy's quantified
// upside (src/lib/improvement.ts) — agent/wholesaler-facing federal math,
// never client copy.

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    primaryAge: 74,
    healthRating: null,
    healthNotes: null,
    tobaccoUse: null,
    tobaccoNotes: null,
    businessOwnerStatus: null,
    businessStructure: null,
    coOwnersNotes: null,
    keyEmployeesCount: null,
    keyEmployeesNotes: null,
    incomeRevenueRange: null,
    primaryGoals: ["legacy"],
    goalsNotes: null,
    existingRelationship: null,
    maritalStatus: null,
    estimatedEstateValue: null,
    estimatedQualifiedBalance: null,
    estimatedTaxableIncome: null,
    ...overrides,
  } as unknown as Scenario;
}

const emptyClassification: AvatarClassification = {
  activated: [],
  needsMoreInfo: [],
  amtTrapFlag: false,
  amtTrapNote: null,
};
const strat = (slug: string, name: string) => ({ slug, name }) as unknown as Strategy;
const agent = { name: "Test Agent", email: "agent@example.com" } as unknown as User;

describe("wholesaler handoff — quantified upside block", () => {
  it("surfaces the current-path vs. design math when case numbers are present", () => {
    const content = buildHandoffContent(
      scenario({ estimatedQualifiedBalance: 2_000_000, estimatedTaxableIncome: 300_000 }),
      emptyClassification,
      [strat("rmd-repositioning", "RMD Repositioning")],
      null,
      null,
      agent,
    );
    const joined = content.improvementLines.join(" ");
    expect(joined).toContain("RMD Repositioning — current path");
    expect(joined).toContain("With the design");
    // $2M at the client's 35% marginal rate = the heirs'-tax figure.
    expect(joined).toContain("$700,000");
  });

  it("names the missing case numbers when they aren't entered yet", () => {
    const content = buildHandoffContent(
      scenario(),
      emptyClassification,
      [strat("rmd-repositioning", "RMD Repositioning")],
      null,
      null,
      agent,
    );
    expect(content.improvementLines.join(" ")).toContain("estimated qualified balance");
    expect(content.improvementLines.join(" ")).toContain("estimated taxable income");
  });

  it("surfaces the first COMPUTABLE strategy in the stack, not just the alphabetical primary", () => {
    // Real QFH ordering puts Qualified LTC (no federal-table computation)
    // first; the block should still show QWT's quantified story rather than
    // going silent.
    const content = buildHandoffContent(
      scenario({ estimatedQualifiedBalance: 2_000_000, estimatedTaxableIncome: 300_000 }),
      emptyClassification,
      [
        strat("qualified-ltc", "Qualified LTC Funding"),
        strat("quiet-wealth-transfer", "Quiet Wealth Transfer (QWT)"),
      ],
      null,
      null,
      agent,
    );
    const joined = content.improvementLines.join(" ");
    expect(joined).toContain("Quiet Wealth Transfer (QWT) — current path");
    expect(joined).not.toContain("Qualified LTC Funding — current path");
  });

  it("stays quiet for strategies with no federal-table computation (e.g. buy-sell)", () => {
    const content = buildHandoffContent(
      scenario({ businessOwnerStatus: "business_owner", coOwnersNotes: "50/50" }),
      emptyClassification,
      [strat("buy-sell-life-insurance", "Buy-Sell Agreement Funding")],
      null,
      null,
      agent,
    );
    expect(content.improvementLines).toEqual([]);
  });
});
