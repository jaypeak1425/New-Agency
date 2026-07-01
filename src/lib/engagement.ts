const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(date: Date | null | undefined, now: number): number {
  return date ? (now - date.getTime()) / DAY_MS : Infinity;
}

export type EngagementScore = "high" | "medium" | "low";

// docs/08-master-dashboard.md section 2, Sub-module 3A. This app has no
// separate "prospect" entity distinct from a Scenario — a Scenario *is* the
// logged prospect — so "added a prospect" and "generated a scenario" are
// read from the same table: "added a prospect" = a Scenario was created,
// "generated a scenario" = its intake was completed (the point at which the
// recommendation engine actually runs).
export function engagementScoreFor(
  lastLoginAt: Date | null,
  mostRecentScenarioCreatedAt: Date | null,
  mostRecentIntakeCompletedAt: Date | null,
  now: number = Date.now(),
): EngagementScore {
  const loginDays = daysSince(lastLoginAt, now);
  const prospectDays = daysSince(mostRecentScenarioCreatedAt, now);
  const scenarioDays = daysSince(mostRecentIntakeCompletedAt, now);

  if (loginDays <= 7 && prospectDays <= 30 && scenarioDays <= 60) return "high";
  if (loginDays <= 14 && prospectDays <= 90) return "medium";
  return "low";
}
