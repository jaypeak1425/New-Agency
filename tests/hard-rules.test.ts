import { describe, it, expect } from "vitest";
import { checkHardRules, type HardRuleRecommendation } from "@/lib/hard-rules";

describe("checkHardRules", () => {
  it("allows a recommendation with no hard-rule triggers", () => {
    const result = checkHardRules({});
    expect(result.allowed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("rule 1: rejects a direct annuity-to-life §1035 exchange and suggests the SPIA bridge", () => {
    const recommendation: HardRuleRecommendation = {
      exchange: { from: "annuity", to: "life" },
    };
    const result = checkHardRules(recommendation);
    expect(result.allowed).toBe(false);
    const violation = result.violations.find((v) => v.rule === 1);
    expect(violation).toBeDefined();
    expect(violation?.suggestion?.toLowerCase()).toContain("spia bridge");
  });

  it("rule 1: still rejects annuity-to-life even if funds are marked non-qualified", () => {
    const result = checkHardRules({
      exchange: { from: "annuity", to: "life", fundsQualified: false },
    });
    expect(result.violations.some((v) => v.rule === 1)).toBe(true);
  });

  it("rule 2: rejects a §1035 exchange of qualified funds", () => {
    const result = checkHardRules({
      exchange: { from: "annuity", to: "annuity", fundsQualified: true },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 2)).toBe(true);
  });

  it("rule 2: allows a §1035 exchange of non-qualified funds", () => {
    const result = checkHardRules({
      exchange: { from: "annuity", to: "annuity", fundsQualified: false },
    });
    expect(result.violations.some((v) => v.rule === 2)).toBe(false);
  });

  it("rule 3: rejects a life-to-life §1035 exchange with a different insured", () => {
    const result = checkHardRules({
      exchange: { from: "life", to: "life", sameInsured: false, sameOwner: true },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 3)).toBe(true);
  });

  it("rule 3: rejects a life-to-life §1035 exchange with a different owner", () => {
    const result = checkHardRules({
      exchange: { from: "life", to: "life", sameInsured: true, sameOwner: false },
    });
    expect(result.violations.some((v) => v.rule === 3)).toBe(true);
  });

  it("rule 3: allows a life-to-life §1035 exchange with the same insured and owner", () => {
    const result = checkHardRules({
      exchange: { from: "life", to: "life", sameInsured: true, sameOwner: true },
    });
    expect(result.violations.some((v) => v.rule === 3)).toBe(false);
  });

  it("rule 4: rejects an ILIT that is not the original owner", () => {
    const result = checkHardRules({ ilit: { isOriginalOwner: false } });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 4)).toBe(true);
  });

  it("rule 4: allows an ILIT that is the original owner", () => {
    const result = checkHardRules({ ilit: { isOriginalOwner: true } });
    expect(result.violations.some((v) => v.rule === 4)).toBe(false);
  });

  it("rule 5: rejects COLI missing §101(j) notice and consent", () => {
    const result = checkHardRules({
      coli: { section101jNoticeProvided: false, noticeProvidedBeforeIssue: false },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 5)).toBe(true);
  });

  it("rule 5: rejects COLI where notice was provided but after issue", () => {
    const result = checkHardRules({
      coli: { section101jNoticeProvided: true, noticeProvidedBeforeIssue: false },
    });
    expect(result.violations.some((v) => v.rule === 5)).toBe(true);
  });

  it("rule 5: allows COLI with notice and consent before issue", () => {
    const result = checkHardRules({
      coli: { section101jNoticeProvided: true, noticeProvidedBeforeIssue: true },
    });
    expect(result.violations.some((v) => v.rule === 5)).toBe(false);
  });

  it("rule 6: rejects attempting to reverse a triggered MEC", () => {
    const result = checkHardRules({ mec: { triggered: true, attemptingToReverse: true } });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 6)).toBe(true);
  });

  it("rule 6: allows an acknowledged MEC with no attempt to reverse it", () => {
    const result = checkHardRules({ mec: { triggered: true, attemptingToReverse: false } });
    expect(result.violations.some((v) => v.rule === 6)).toBe(false);
  });

  it("rule 7: rejects a §162 bonus that isn't reasonable compensation", () => {
    const result = checkHardRules({ executiveBonus162: { compensationReasonable: false } });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 7)).toBe(true);
  });

  it("rule 7: allows a §162 bonus that is reasonable compensation", () => {
    const result = checkHardRules({ executiveBonus162: { compensationReasonable: true } });
    expect(result.violations.some((v) => v.rule === 7)).toBe(false);
  });

  it("rule 8: rejects a spouse's IRA funding joint LTC benefits", () => {
    const result = checkHardRules({
      qualifiedLtc: { fundedBySpouseIra: true, jointBenefit: true },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 8)).toBe(true);
  });

  it("rule 8: allows a spouse's IRA funding a single (non-joint) LTC benefit", () => {
    const result = checkHardRules({
      qualifiedLtc: { fundedBySpouseIra: true, jointBenefit: false },
    });
    expect(result.violations.some((v) => v.rule === 8)).toBe(false);
  });

  it("rule 9: rejects a qualified-plan face amount exceeding the §415(b) limit", () => {
    const result = checkHardRules({
      qualifiedPlanLifeInsurance: { faceAmount: 500_000, section415bLimit: 275_000 },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((v) => v.rule === 9)).toBe(true);
  });

  it("rule 9: allows a qualified-plan face amount within the §415(b) limit", () => {
    const result = checkHardRules({
      qualifiedPlanLifeInsurance: { faceAmount: 200_000, section415bLimit: 275_000 },
    });
    expect(result.violations.some((v) => v.rule === 9)).toBe(false);
  });

  it("collects violations from multiple independent rules in one recommendation", () => {
    const result = checkHardRules({
      exchange: { from: "annuity", to: "life" },
      coli: { section101jNoticeProvided: false, noticeProvidedBeforeIssue: false },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.map((v) => v.rule).sort()).toEqual([1, 5]);
  });
});
