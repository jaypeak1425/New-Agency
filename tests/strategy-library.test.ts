import { describe, it, expect } from "vitest";
import { strategyLibrarySeed } from "../prisma/strategy-library-data";
import { missingCardFields } from "@/lib/strategies";
import { GATES } from "@/lib/recommendations";
import type { AnnuityIntake, Scenario, Strategy } from "@/generated/prisma/client";

// The seed entries lack the DB-generated columns; missingCardFields only
// reads the content fields, so the cast is safe for these tests.
function asStrategy(seed: (typeof strategyLibrarySeed)[number]): Strategy {
  return seed as unknown as Strategy;
}

// Minimal scenario stub — gates only read the intake answer fields.
function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    primaryGoals: [],
    existingStructures: [],
    primaryAge: null,
    qualifiedFundsEstimate: null,
    maritalStatus: null,
    estateExceedsExemption: null,
    illiquidNetWorth: null,
    concentratedLowBasisPosition: null,
    businessOwnerStatus: null,
    ...overrides,
  } as unknown as Scenario;
}

function annuityIntake(overrides: Partial<AnnuityIntake> = {}): AnnuityIntake {
  return {
    existingAnnuityContractsNotes: null,
    sourceOfFunds: null,
    ...overrides,
  } as unknown as AnnuityIntake;
}

describe("strategy library seed (Brain content)", () => {
  it("has a complete card for every strategy — including the 7 researched drafts", () => {
    for (const seed of strategyLibrarySeed) {
      expect(missingCardFields(asStrategy(seed)), `card for ${seed.slug}`).toEqual([]);
    }
  });

  it("ships the full library live — owner signed off on all 7 researched cards (2026-07-02)", () => {
    // Brain Lock still holds structurally: anything pending_content is never
    // surfaced. As of the owner's "Go live with all" sign-off there simply
    // isn't anything pending — and each formerly-pending card records the
    // sign-off in its notes.
    expect(strategyLibrarySeed.filter((s) => s.status !== "documented")).toEqual([]);
    const signedOff = strategyLibrarySeed.filter((s) =>
      s.notes?.includes("approved live by owner sign-off 2026-07-02"),
    );
    expect(signedOff.map((s) => s.slug).sort()).toEqual([
      "annuity-rescue",
      "estate-funding",
      "grats",
      "qualified-ltc",
      "quiet-wealth-transfer",
      "rmd-repositioning",
      "roth-plus-life",
    ]);
  });

  it("has a recommendation gate for every seeded strategy (no silent needs_more_info fallbacks)", () => {
    for (const seed of strategyLibrarySeed) {
      expect(GATES[seed.slug], `gate for ${seed.slug}`).toBeTypeOf("function");
    }
  });

  it("rejects an incomplete card (docs/09 Gate 1)", () => {
    const placeholder = asStrategy({
      slug: "empty",
      name: "Empty",
      tier: "core",
      status: "pending_content",
      avatarTags: [],
      uplineQuestions: [],
    } as unknown as (typeof strategyLibrarySeed)[number]);
    expect(missingCardFields(placeholder)).toEqual([
      "client trigger profile",
      "legal basis",
      "mechanics",
      "why used",
      "matching parameters",
      "upline questions",
    ]);
  });
});

describe("gates for the 7 researched strategies", () => {
  it("estate-funding is the single-life / first-death lane (married goes to survivorship)", () => {
    const base = { estateExceedsExemption: true, illiquidNetWorth: true } as const;
    expect(GATES["estate-funding"](scenario({ ...base, maritalStatus: "single" }), null)).toBe("eligible");
    expect(GATES["estate-funding"](scenario({ ...base, maritalStatus: "married" }), null)).toBe("not_eligible");
    expect(GATES["estate-funding"](scenario(base), null)).toBe("needs_more_info");
  });

  it("quiet-wealth-transfer needs $500K+ qualified AND a legacy-intent goal", () => {
    expect(
      GATES["quiet-wealth-transfer"](
        scenario({ qualifiedFundsEstimate: "over_500k", primaryGoals: ["legacy"] }),
        null,
      ),
    ).toBe("eligible");
    expect(
      GATES["quiet-wealth-transfer"](
        scenario({ qualifiedFundsEstimate: "over_500k", primaryGoals: ["retirement_income"] }),
        null,
      ),
    ).toBe("not_eligible");
    expect(GATES["quiet-wealth-transfer"](scenario(), null)).toBe("needs_more_info");
  });

  it("rmd-repositioning opens at the SECURE 2.0 required beginning age (73)", () => {
    const base: Partial<Scenario> = {
      qualifiedFundsEstimate: "over_500k",
      primaryGoals: ["estate_planning"],
    };
    expect(GATES["rmd-repositioning"](scenario({ ...base, primaryAge: 74 }), null)).toBe("eligible");
    expect(GATES["rmd-repositioning"](scenario({ ...base, primaryAge: 70 }), null)).toBe("not_eligible");
  });

  it("annuity-rescue requires the annuity intake and an existing contract", () => {
    expect(GATES["annuity-rescue"](scenario(), null)).toBe("needs_more_info");
    expect(
      GATES["annuity-rescue"](
        scenario(),
        annuityIntake({
          existingAnnuityContractsNotes: "Old VA, $180K gain, out of surrender",
          sourceOfFunds: "non_qualified",
        }),
      ),
    ).toBe("eligible");
    expect(
      GATES["annuity-rescue"](
        scenario(),
        annuityIntake({ existingAnnuityContractsNotes: "", sourceOfFunds: "non_qualified" }),
      ),
    ).toBe("not_eligible");
  });

  it("qualified-ltc: existing annuity (PPA §1035 path) or 60+ with $500K+ qualified (distribution path)", () => {
    expect(
      GATES["qualified-ltc"](
        scenario(),
        annuityIntake({ existingAnnuityContractsNotes: "Fixed annuity with gain" }),
      ),
    ).toBe("eligible");
    expect(
      GATES["qualified-ltc"](
        scenario({ qualifiedFundsEstimate: "over_500k", primaryAge: 65 }),
        null,
      ),
    ).toBe("eligible");
    expect(
      GATES["qualified-ltc"](
        scenario({ qualifiedFundsEstimate: "over_500k", primaryAge: 50 }),
        null,
      ),
    ).toBe("not_eligible");
    expect(GATES["qualified-ltc"](scenario(), null)).toBe("needs_more_info");
  });
});
