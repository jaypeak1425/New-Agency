import { cn } from "@/lib/cn";
import type { ScenarioStatus } from "@/generated/prisma/client";

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  draft: "Draft",
  active: "Active",
  in_underwriting: "In underwriting",
  closed_won: "Closed — won",
  closed_lost: "Closed — lost",
};

const TONES: Record<ScenarioStatus, string> = {
  draft: "bg-charcoal/10 text-charcoal/70",
  active: "bg-navy/10 text-navy",
  in_underwriting: "bg-gold/20 text-navy",
  closed_won: "bg-gold/30 text-navy",
  closed_lost: "bg-red-100 text-red-700",
};

export function ScenarioStatusBadge({ status }: { status: ScenarioStatus }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[status])}>
      {SCENARIO_STATUS_LABELS[status]}
    </span>
  );
}
