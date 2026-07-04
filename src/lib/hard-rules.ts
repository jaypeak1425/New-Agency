// The 9 non-negotiable hard rules, encoded at the engine level per CLAUDE.md
// ("Cross-cutting rules — enforce in ALL phases") and docs/00-developer-brief.md
// section 5. Standalone, Brain-independent module (phase-1-sessions/PHASE-1.md
// "Parallel Session B") — drops into Phase 3's recommendation/pivot engine.
//
// `HardRuleRecommendation` models only the fields each rule needs to check.
// A real Phase 3 recommendation only populates the sub-objects relevant to
// the strategy being evaluated (e.g. a buy-sell recommendation never sets
// `exchange` or `mec`).

export interface HardRuleRecommendation {
  exchange?: {
    from: "annuity" | "life";
    to: "annuity" | "life";
    fundsQualified?: boolean;
    sameInsured?: boolean;
    sameOwner?: boolean;
  };
  ilit?: {
    isOriginalOwner?: boolean;
  };
  coli?: {
    section101jNoticeProvided?: boolean;
    noticeProvidedBeforeIssue?: boolean;
  };
  mec?: {
    triggered?: boolean;
    attemptingToReverse?: boolean;
  };
  executiveBonus162?: {
    compensationReasonable?: boolean;
  };
  qualifiedLtc?: {
    fundedBySpouseIra?: boolean;
    jointBenefit?: boolean;
  };
  qualifiedPlanLifeInsurance?: {
    faceAmount?: number;
    section415bLimit?: number;
  };
}

export interface HardRuleViolation {
  rule: number;
  message: string;
  suggestion?: string;
}

export interface HardRuleCheckResult {
  allowed: boolean;
  violations: HardRuleViolation[];
}

export function checkHardRules(recommendation: HardRuleRecommendation): HardRuleCheckResult {
  const violations: HardRuleViolation[] = [];

  const { exchange, ilit, coli, mec, executiveBonus162, qualifiedLtc, qualifiedPlanLifeInsurance } =
    recommendation;

  // Rule 1: direct annuity->life §1035 does not exist as a mechanism — it is
  // never valid, full stop. The only valid repositioning path is the SPIA
  // bridge (annuitize to a SPIA, use the taxable income to fund a separate
  // life policy owned by an ILIT as original owner).
  if (exchange?.from === "annuity" && exchange.to === "life") {
    violations.push({
      rule: 1,
      message: "Direct annuity-to-life §1035 exchanges are never valid — no such exchange exists.",
      suggestion:
        "Route through the SPIA bridge instead: annuitize to a SPIA, then use the taxable income to fund a separate life insurance policy owned by an ILIT as the original owner.",
    });
  }

  // Rule 2: §1035 applies to non-qualified contracts only.
  if (exchange && exchange.fundsQualified === true) {
    violations.push({
      rule: 2,
      message: "§1035 exchanges are for non-qualified contracts only.",
      suggestion: "Qualified money must use rollover/transfer rules, not a §1035 exchange.",
    });
  }

  // Rule 3: life-to-life §1035 requires the same insured and the same owner.
  if (
    exchange?.from === "life" &&
    exchange.to === "life" &&
    (exchange.sameInsured === false || exchange.sameOwner === false)
  ) {
    violations.push({
      rule: 3,
      message: "Life-to-life §1035 exchanges require the same insured and the same owner.",
    });
  }

  // Rule 4: the ILIT must be the original owner to avoid the §2035 3-year
  // lookback (transferring an existing policy into the trust doesn't).
  if (ilit && ilit.isOriginalOwner === false) {
    violations.push({
      rule: 4,
      message: "The ILIT is not the original owner — the §2035 3-year lookback applies.",
      suggestion: "Structure the policy as new-issue with the ILIT as original owner/applicant.",
    });
  }

  // Rule 5: COLI requires §101(j) notice and consent before issue.
  if (
    coli &&
    (coli.section101jNoticeProvided !== true || coli.noticeProvidedBeforeIssue !== true)
  ) {
    violations.push({
      rule: 5,
      message: "COLI requires §101(j) notice and consent before the policy is issued.",
    });
  }

  // Rule 6: MEC status is irrevocable once triggered.
  if (mec?.triggered === true && mec.attemptingToReverse === true) {
    violations.push({
      rule: 6,
      message: "MEC status is irrevocable once triggered — it cannot be reversed.",
    });
  }

  // Rule 7: §162 executive bonus must qualify as reasonable compensation.
  if (executiveBonus162 && executiveBonus162.compensationReasonable === false) {
    violations.push({
      rule: 7,
      message: "This §162 executive bonus does not qualify as reasonable compensation.",
    });
  }

  // Rule 8: a spouse's IRA cannot fund joint LTC benefits (prohibited transaction).
  if (
    qualifiedLtc &&
    qualifiedLtc.fundedBySpouseIra === true &&
    qualifiedLtc.jointBenefit === true
  ) {
    violations.push({
      rule: 8,
      message: "A spouse's IRA cannot fund joint LTC benefits — this is a prohibited transaction.",
    });
  }

  // Rule 9: §415(b) limits apply to life insurance inside qualified plans.
  if (
    qualifiedPlanLifeInsurance &&
    qualifiedPlanLifeInsurance.faceAmount !== undefined &&
    qualifiedPlanLifeInsurance.section415bLimit !== undefined &&
    qualifiedPlanLifeInsurance.faceAmount > qualifiedPlanLifeInsurance.section415bLimit
  ) {
    violations.push({
      rule: 9,
      message: "The face amount exceeds the §415(b) limit for life insurance in this qualified plan.",
    });
  }

  return { allowed: violations.length === 0, violations };
}
