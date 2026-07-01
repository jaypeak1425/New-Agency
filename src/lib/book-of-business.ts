import type { AgentProfile } from "@/generated/prisma/client";

// CLAUDE.md's locked numeric defaults ("Per-avatar Y1 commission model") +
// docs/07-progress-dashboard-math.md section 4's per-avatar model — the two
// sources agree exactly.
export const PER_AVATAR_ANNUAL_COMMISSION = {
  businessOwnersWithCoOwners: 35_000,
  businessOwnersSolo: 12_000,
  hnwIndividuals: 8_000,
  qualifiedFundHeavy: 6_000,
  familyLegacy: 2_500,
} as const;

// CLAUDE.md: "Book-of-business addressable filter: 15%."
export const DEFAULT_BOOK_ADDRESSABLE_FILTER = 0.15;

export interface BookOfBusinessLine {
  label: string;
  count: number;
  perClientCommission: number;
  subtotal: number;
}

export interface BookOfBusinessOpportunity {
  lines: BookOfBusinessLine[];
  totalOpportunity: number;
  addressableFilterPercent: number;
  addressableOpportunity: number;
}

// docs/07-progress-dashboard-math.md section 4's worked example: sum the
// per-avatar subtotals, then apply the "addressable in next 12 months"
// filter (default 15%, agent can override).
export function computeBookOfBusinessOpportunity(
  agentProfile: Pick<
    AgentProfile,
    | "businessOwnersWithCoOwnersCount"
    | "businessOwnersSoloCount"
    | "hnwIndividualsCount"
    | "qualifiedFundHeavyCount"
    | "familyLegacyCount"
    | "bookAddressableFilterOverridePercent"
  > | null,
): BookOfBusinessOpportunity | null {
  if (!agentProfile) return null;

  const counts: Array<[keyof typeof PER_AVATAR_ANNUAL_COMMISSION, string, number | null]> = [
    [
      "businessOwnersWithCoOwners",
      "Business owners with co-owners",
      agentProfile.businessOwnersWithCoOwnersCount,
    ],
    ["businessOwnersSolo", "Business owners, solo", agentProfile.businessOwnersSoloCount],
    ["hnwIndividuals", "HNW individuals", agentProfile.hnwIndividualsCount],
    ["qualifiedFundHeavy", "Qualified fund heavy", agentProfile.qualifiedFundHeavyCount],
    ["familyLegacy", "Family / Legacy", agentProfile.familyLegacyCount],
  ];

  const hasAnyData = counts.some(([, , count]) => count !== null && count !== undefined);
  if (!hasAnyData) return null;

  const lines: BookOfBusinessLine[] = counts.map(([key, label, count]) => {
    const perClientCommission = PER_AVATAR_ANNUAL_COMMISSION[key];
    const safeCount = count ?? 0;
    return { label, count: safeCount, perClientCommission, subtotal: safeCount * perClientCommission };
  });

  const totalOpportunity = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const addressableFilterPercent =
    agentProfile.bookAddressableFilterOverridePercent ?? DEFAULT_BOOK_ADDRESSABLE_FILTER;
  const addressableOpportunity = Math.round(totalOpportunity * addressableFilterPercent);

  return { lines, totalOpportunity, addressableFilterPercent, addressableOpportunity };
}
