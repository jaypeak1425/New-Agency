import { ESTATE_LEGACY_CONCEPTS } from "./concept-library-content-estate";
import {
  WEALTH_TRANSFER_CONCEPTS,
  CHARITABLE_CONCEPTS,
} from "./concept-library-content-transfer";
import {
  BUSINESS_EXECUTIVE_CONCEPTS,
  QUALIFIED_RETIREMENT_CONCEPTS,
} from "./concept-library-content-business";
import {
  CATEGORY_ORDER,
  type ConceptCategory,
  type ConceptLibraryEntry,
} from "./concept-library-types";
import type { Strategy } from "@/generated/prisma/client";

export type { ConceptCategory, ConceptLibraryEntry } from "./concept-library-types";
export { CATEGORY_LABELS, CATEGORY_ORDER } from "./concept-library-types";

// The full Library, keyed by strategy slug. Brain-lock discipline applies at
// the page layer: an entry only ever renders for a strategy that is
// `documented` in the DB — this map carries content, never eligibility.
export const CONCEPT_LIBRARY: Record<string, ConceptLibraryEntry> = {
  ...ESTATE_LEGACY_CONCEPTS,
  ...WEALTH_TRANSFER_CONCEPTS,
  ...CHARITABLE_CONCEPTS,
  ...BUSINESS_EXECUTIVE_CONCEPTS,
  ...QUALIFIED_RETIREMENT_CONCEPTS,
};

export function conceptEntry(slug: string): ConceptLibraryEntry | undefined {
  return CONCEPT_LIBRARY[slug];
}

// Groups documented strategies into ordered category buckets for the Library
// index. Strategies without a Library entry (a future strategy added before
// its content) simply don't appear — the Library never shows an empty shell.
export function groupStrategiesByCategory(
  strategies: Strategy[],
): Array<{ category: ConceptCategory; strategies: Strategy[] }> {
  const byCategory = new Map<ConceptCategory, Strategy[]>();
  for (const strategy of strategies) {
    const entry = CONCEPT_LIBRARY[strategy.slug];
    if (!entry) continue;
    const bucket = byCategory.get(entry.category) ?? [];
    bucket.push(strategy);
    byCategory.set(entry.category, bucket);
  }
  return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => ({
    category,
    strategies: byCategory.get(category)!,
  }));
}
