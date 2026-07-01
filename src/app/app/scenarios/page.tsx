import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listScenariosForUser } from "@/lib/scenarios";
import { createScenarioAction, notifyWholesalerAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  const scenarios = await listScenariosForUser(user!.id);
  const hasWholesaler = Boolean(user!.assignedWholesalerId);

  return (
    <div>
      <h1 className="text-3xl">Scenarios</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Log a case, walk through Atlas&rsquo;s 10-question intake, and notify your wholesaler when
        you&rsquo;re ready to talk it through.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-medium text-navy">New case</h2>
        <form action={createScenarioAction} className="mt-4 space-y-4">
          <Input label="Case label" name="label" type="text" required placeholder="e.g. Smith family — ILIT" />
          <label className="block text-sm font-medium text-charcoal">
            Notes
            <textarea
              name="notes"
              rows={3}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="Optional context for yourself or your wholesaler"
            />
          </label>
          <SubmitButton pendingText="Saving…">Add case</SubmitButton>
        </form>
      </Card>

      {!hasWholesaler && (
        <p className="mt-6 text-sm text-charcoal/60">
          No wholesaler is assigned to your account yet — an admin needs to assign one before you
          can notify them about a case.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-navy">{scenario.label}</h3>
                {scenario.notes && <p className="mt-1 text-sm text-charcoal/70">{scenario.notes}</p>}
                <p className="mt-2 text-xs uppercase tracking-wide text-charcoal/50">
                  {scenario.status}
                </p>
                {scenario.wholesalerNotifiedAt && (
                  <p className="mt-1 text-xs text-charcoal/50">
                    Wholesaler notified {new Date(scenario.wholesalerNotifiedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <Link
                  href={`/app/scenarios/${scenario.id}/intake`}
                  className="whitespace-nowrap text-xs text-navy hover:text-gold"
                >
                  {scenario.intakeCompletedAt ? "Review intake" : "Complete intake"}
                </Link>
                {hasWholesaler && (
                  <form action={notifyWholesalerAction}>
                    <input type="hidden" name="scenarioId" value={scenario.id} />
                    <SubmitButton
                      variant="outline"
                      pendingText="Notifying…"
                      className="whitespace-nowrap px-3 py-1.5 text-xs"
                    >
                      {scenario.wholesalerNotifiedAt ? "Notify again" : "Notify my wholesaler"}
                    </SubmitButton>
                  </form>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
