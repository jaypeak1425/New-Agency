// Shared types for the Concept Library (owner directive 2026-07-06): every
// documented strategy in the Brain gets a Library entry organized by
// concept category, carrying the two content pieces the Strategy card and
// pitch narrative don't already hold — an illustrative case study and the
// top-10 questions a CPA or client will ask. The internal explanation
// renders from the Strategy record itself and the client-facing one-pager
// renders from src/lib/pitch-deck-content.ts through the compliance filter,
// so this module never duplicates either.

export type ConceptCategory =
  | "estate_legacy"
  | "wealth_transfer"
  | "charitable"
  | "business_executive"
  | "qualified_retirement";

export const CATEGORY_ORDER: ConceptCategory[] = [
  "business_executive",
  "estate_legacy",
  "wealth_transfer",
  "qualified_retirement",
  "charitable",
];

export const CATEGORY_LABELS: Record<ConceptCategory, string> = {
  business_executive: "Business Owner & Executive Benefits",
  estate_legacy: "Estate & Legacy",
  wealth_transfer: "Advanced Wealth Transfer",
  qualified_retirement: "Qualified Money & Retirement",
  charitable: "Charitable Strategies",
};

export interface ConceptCaseStudy {
  title: string;
  // Illustrative composite — never a real client. The page states this.
  situation: string;
  design: string;
  outcome: string;
}

export interface ConceptQuestion {
  asker: "cpa" | "client";
  q: string;
  a: string;
}

export interface ConceptLibraryEntry {
  category: ConceptCategory;
  caseStudy: ConceptCaseStudy;
  topQuestions: ConceptQuestion[];
}
