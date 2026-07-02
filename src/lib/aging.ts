import type { Scenario } from "@/generated/prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export type AgingStatus = "active" | "stale" | "at_risk" | "cold";

export const AGING_LABELS: Record<AgingStatus, string> = {
  active: "Active",
  stale: "Stale",
  at_risk: "At risk",
  cold: "Cold",
};

// docs/07-progress-dashboard-math.md section 6's aging triggers: 0-7 days
// Active, 8-14 Stale, 15-30 At risk, 31+ Cold. "Time since last activity"
// uses updatedAt — the same simplification the dashboard's This Week's
// Pipeline widget documents (no separate activity log or meeting scheduler
// exists). The doc's per-agent aging overrides ("some scenarios legitimately
// take months") aren't modeled yet — no override field exists.
export function agingStatusFor(updatedAt: Date, now: number = Date.now()): {
  status: AgingStatus;
  daysSinceActivity: number;
} {
  const daysSinceActivity = Math.floor((now - updatedAt.getTime()) / DAY_MS);
  if (daysSinceActivity <= 7) return { status: "active", daysSinceActivity };
  if (daysSinceActivity <= 14) return { status: "stale", daysSinceActivity };
  if (daysSinceActivity <= 30) return { status: "at_risk", daysSinceActivity };
  return { status: "cold", daysSinceActivity };
}

// Section 6's exact "Atlas surfaces:" wording per bucket.
export function agingMessage(scenario: Pick<Scenario, "label" | "updatedAt">, now: number = Date.now()): string | null {
  const { status, daysSinceActivity } = agingStatusFor(scenario.updatedAt, now);
  switch (status) {
    case "stale":
      return `The ${scenario.label} scenario hasn't moved in ${daysSinceActivity} days. What's the next step?`;
    case "at_risk":
      return `The ${scenario.label} scenario is at risk. Last activity was ${scenario.updatedAt.toLocaleDateString()}. Want to revisit?`;
    case "cold":
      return `The ${scenario.label} scenario has gone cold. Should we close it out, or schedule a follow-up?`;
    default:
      return null;
  }
}
