import { describe, it, expect } from "vitest";
import { agingStatusFor, agingMessage } from "@/lib/aging";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

function daysAgo(n: number): Date {
  return new Date(NOW - n * DAY_MS);
}

describe("pipeline aging (docs/07 section 6)", () => {
  it("classifies each bucket at its boundaries", () => {
    expect(agingStatusFor(daysAgo(0), NOW).status).toBe("active");
    expect(agingStatusFor(daysAgo(7), NOW).status).toBe("active");
    expect(agingStatusFor(daysAgo(8), NOW).status).toBe("stale");
    expect(agingStatusFor(daysAgo(14), NOW).status).toBe("stale");
    expect(agingStatusFor(daysAgo(15), NOW).status).toBe("at_risk");
    expect(agingStatusFor(daysAgo(30), NOW).status).toBe("at_risk");
    expect(agingStatusFor(daysAgo(31), NOW).status).toBe("cold");
    expect(agingStatusFor(daysAgo(120), NOW).status).toBe("cold");
  });

  it("uses the doc's exact surfacing language per bucket", () => {
    const smith = (n: number) => ({ label: "Smith", updatedAt: daysAgo(n) });
    expect(agingMessage(smith(3), NOW)).toBeNull();
    expect(agingMessage(smith(9), NOW)).toBe(
      "The Smith scenario hasn't moved in 9 days. What's the next step?",
    );
    expect(agingMessage(smith(20), NOW)).toContain("The Smith scenario is at risk.");
    expect(agingMessage(smith(40), NOW)).toBe(
      "The Smith scenario has gone cold. Should we close it out, or schedule a follow-up?",
    );
  });
});
