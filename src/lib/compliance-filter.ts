// Client-facing compliance language filter, per CLAUDE.md's 3-layer guardrail
// (layer 1) and the compliance language standards in docs/00-developer-brief.md
// section 6. Runs on every client-facing output before delivery.
//
// This is a standalone, Brain-independent module (phase-1-sessions/PHASE-1.md
// "Parallel Session A") — it drops into Phase 3's recommendation/handoff/pitch
// pipeline once that's built, but has no dependency on it.

export type ComplianceViolationType =
  | "tax_free_language"
  | "missing_force_conditioning"
  | "guarantee_language"
  | "outcome_quantification"
  | "irs_form_or_structure_name"
  | "firm_advantage_or_cpa_on_staff";

export interface ComplianceViolation {
  type: ComplianceViolationType;
  match: string;
  autoFixable: boolean;
}

export type ComplianceFilterStatus = "pass" | "rewrite" | "hold";

export interface ComplianceFilterResult {
  status: ComplianceFilterStatus;
  output: string;
  violations: ComplianceViolation[];
}

const TAX_FREE_PATTERN = /\btax[\s-]?free\b/gi;

const GUARANTEE_PATTERN =
  /\b(guarantee(s|d|ing)?|money[\s-]back guarantee|premium[\s-]back guarantee)\b/gi;

const OUTCOME_DOLLAR_PATTERN = /\$[\d,]+(\.\d+)?/;
const OUTCOME_CLAIM_VERB_PATTERN = /\b(you'll|you will|will earn|will receive|will pay you|will get)\b/i;

const IRS_FORM_PATTERN = /\bform\s+[\d]+[a-z0-9-]*\b/gi;
const IRC_SECTION_PATTERN = /(§|\bsection\s?)\s?\d+[a-z()]*\b/gi;

const STRUCTURE_NAMES = [
  "ILIT",
  "SLAT",
  "GRAT",
  "IDGT",
  "FLP",
  "FLLC",
  "QWT",
  "Quiet Wealth Transfer",
  "SPIA bridge",
  "REBA",
  "COLI",
  "1035 exchange",
];
const STRUCTURE_NAME_PATTERN = new RegExp(
  `\\b(${STRUCTURE_NAMES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi",
);

const FIRM_ADVANTAGE_PATTERN = /\bfirm advantage\b/gi;
const CPA_ON_STAFF_PATTERN =
  /\b((cpa|attorney)[\s-]?on[\s-]?staff|our (cpa|attorney)|in-house (cpa|attorney))\b/gi;

const FORCE_CONDITIONING_PHRASE = "while the policy remains in force";
const BENEFIT_CLAIM_TRIGGER_PATTERN =
  /\b(death benefit|proceeds|payout|income stream|cash value)\b/i;

function findAll(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)].map((m) => m[0]);
}

export function complianceFilter(text: string): ComplianceFilterResult {
  const violations: ComplianceViolation[] = [];

  for (const match of findAll(text, TAX_FREE_PATTERN)) {
    violations.push({ type: "tax_free_language", match, autoFixable: true });
  }

  const hasBenefitClaim = BENEFIT_CLAIM_TRIGGER_PATTERN.test(text);
  const hasConditioning = text.toLowerCase().includes(FORCE_CONDITIONING_PHRASE);
  if (hasBenefitClaim && !hasConditioning) {
    violations.push({
      type: "missing_force_conditioning",
      match: text.match(BENEFIT_CLAIM_TRIGGER_PATTERN)?.[0] ?? "",
      autoFixable: true,
    });
  }

  for (const match of findAll(text, GUARANTEE_PATTERN)) {
    violations.push({ type: "guarantee_language", match, autoFixable: false });
  }

  if (OUTCOME_DOLLAR_PATTERN.test(text) && OUTCOME_CLAIM_VERB_PATTERN.test(text)) {
    violations.push({
      type: "outcome_quantification",
      match: text.match(OUTCOME_DOLLAR_PATTERN)?.[0] ?? "",
      autoFixable: false,
    });
  }

  for (const match of [
    ...findAll(text, IRS_FORM_PATTERN),
    ...findAll(text, IRC_SECTION_PATTERN),
    ...findAll(text, STRUCTURE_NAME_PATTERN),
  ]) {
    violations.push({ type: "irs_form_or_structure_name", match, autoFixable: false });
  }

  for (const match of [
    ...findAll(text, FIRM_ADVANTAGE_PATTERN),
    ...findAll(text, CPA_ON_STAFF_PATTERN),
  ]) {
    violations.push({ type: "firm_advantage_or_cpa_on_staff", match, autoFixable: false });
  }

  if (violations.length === 0) {
    return { status: "pass", output: text, violations: [] };
  }

  const needsHold = violations.some((v) => !v.autoFixable);
  if (needsHold) {
    return { status: "hold", output: text, violations };
  }

  let output = text.replace(TAX_FREE_PATTERN, "non-taxable");
  if (hasBenefitClaim && !hasConditioning) {
    output = `${output.trimEnd()} This benefit applies ${FORCE_CONDITIONING_PHRASE}.`;
  }

  return { status: "rewrite", output, violations };
}
