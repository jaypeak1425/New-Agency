import Link from "next/link";
import { getLaunchReadiness } from "@/lib/launch";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function ReadyDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full",
        ok ? "bg-gold" : "bg-red-400",
      )}
    />
  );
}

export default async function AdminLaunchPage() {
  const phases = await getLaunchReadiness();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Launch readiness</h1>
        <Link href="/admin" className="text-sm text-navy hover:text-gold">
          Clients &amp; actions &rarr;
        </Link>
      </div>
      <p className="mt-2 text-sm text-charcoal/60">
        The phased Railway rollout, checked against this deployment&rsquo;s live configuration —
        see docs/24-railway-launch-runbook.md for the step-by-step. A phase being red doesn&rsquo;t
        break the app: everything downstream of missing configuration degrades gracefully (billing
        runs in pilot mode, emails log to the deploy console).
      </p>

      <div className="mt-6 space-y-4">
        {phases.map((phase) => {
          const allOk = phase.items.every((i) => i.ok);
          return (
            <Card key={phase.phase}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-navy">{phase.phase}</h2>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    allOk ? "bg-gold/20 text-navy" : "bg-charcoal/10 text-charcoal/70",
                  )}
                >
                  {allOk ? "Ready" : "Not ready"}
                </span>
              </div>
              <p className="mt-1 text-xs text-charcoal/50">{phase.goal}</p>
              <ul className="mt-4 space-y-3">
                {phase.items.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <ReadyDot ok={item.ok} />
                    <div>
                      <p className="text-sm font-medium text-charcoal">{item.label}</p>
                      <p className="text-xs text-charcoal/60">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
