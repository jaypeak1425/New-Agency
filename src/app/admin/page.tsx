import { listUsersForAdmin } from "@/lib/admin";
import { listWholesalersForAdmin } from "@/lib/wholesaler";
import { hasActiveAccess } from "@/lib/billing";
import { getSequenceStats } from "@/lib/sequence";
import {
  approveUserAction,
  suspendUserAction,
  reactivateUserAction,
  grantAccessAction,
  revokeAccessAction,
  createWholesalerAccountAction,
  assignWholesalerAction,
  processSequenceSendsAction,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import Link from "next/link";

function Badge({ tone, children }: { tone: "positive" | "neutral" | "negative"; children: React.ReactNode }) {
  const tones = {
    positive: "bg-gold/20 text-navy",
    neutral: "bg-charcoal/10 text-charcoal",
    negative: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [users, wholesalers, sequenceStats] = await Promise.all([
    listUsersForAdmin(),
    listWholesalersForAdmin(),
    getSequenceStats(),
  ]);
  const smallButton = "px-3 py-1.5 text-xs";
  const selectClassName =
    "rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Admin</h1>
        <div className="flex gap-4">
          <Link href="/admin/dashboard" className="text-sm text-navy hover:text-gold">
            Master dashboard &rarr;
          </Link>
          <Link href="/admin/imos" className="text-sm text-navy hover:text-gold">
            IMOs &rarr;
          </Link>
          <Link href="/admin/strategies" className="text-sm text-navy hover:text-gold">
            Strategy library &rarr;
          </Link>
          <Link href="/admin/compliance" className="text-sm text-navy hover:text-gold">
            Compliance &rarr;
          </Link>
          <Link href="/admin/launch" className="text-sm text-navy hover:text-gold">
            Launch readiness &rarr;
          </Link>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-medium text-charcoal">Create wholesaler account</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Sends a password-setup email so the wholesaler can log in to their portal.
        </p>
        <form action={createWholesalerAccountAction} className="mt-4 flex flex-wrap items-end gap-3">
          <Input label="Email" name="email" type="email" required autoComplete="off" className="w-64" />
          <Input label="Name" name="name" type="text" className="w-64" />
          <SubmitButton pendingText="Creating…" className="px-4 py-2 text-sm">
            Create wholesaler
          </SubmitButton>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-medium text-charcoal">Email sequence (docs/15)</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          {sequenceStats.active} active enrollment(s) · {sequenceStats.dueNow} due to send now ·{" "}
          {sequenceStats.completed} completed · {sequenceStats.unsubscribed} unsubscribed. No
          scheduler exists — process due sends manually.
        </p>
        <form action={processSequenceSendsAction} className="mt-4">
          <SubmitButton pendingText="Sending…" className="px-4 py-2 text-sm">
            Send due sequence emails
          </SubmitButton>
        </form>
      </section>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-charcoal/60">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Account status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Wholesaler</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const active = hasActiveAccess(user.subscription?.status);
              return (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        user.status === "active"
                          ? "positive"
                          : user.status === "pending"
                            ? "neutral"
                            : "negative"
                      }
                    >
                      {user.status === "pending" ? "awaiting approval" : user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{user.subscription?.plan ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={active ? "positive" : "neutral"}>
                      {user.subscription?.status ?? "none"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "user" ? (
                      <form action={assignWholesalerAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="wholesalerUserId"
                          defaultValue={user.assignedWholesalerId ?? ""}
                          className={selectClassName}
                        >
                          <option value="">Unassigned</option>
                          {wholesalers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name ?? w.email}
                            </option>
                          ))}
                        </select>
                        <SubmitButton variant="outline" pendingText="Saving…" className={smallButton}>
                          Save
                        </SubmitButton>
                      </form>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.status === "pending" && (
                        <form action={approveUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton pendingText="Approving…" className={smallButton}>
                            Approve
                          </SubmitButton>
                        </form>
                      )}
                      {user.status === "active" && (
                        <form action={suspendUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton
                            variant="outline"
                            pendingText="Suspending…"
                            className={smallButton}
                          >
                            Suspend
                          </SubmitButton>
                        </form>
                      )}
                      {user.status === "suspended" && (
                        <form action={reactivateUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton
                            variant="outline"
                            pendingText="Reactivating…"
                            className={smallButton}
                          >
                            Reactivate
                          </SubmitButton>
                        </form>
                      )}
                      {active ? (
                        <form action={revokeAccessAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton
                            variant="outline"
                            pendingText="Revoking…"
                            className={smallButton}
                          >
                            Revoke access
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={grantAccessAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton pendingText="Granting…" className={smallButton}>
                            Grant access
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
