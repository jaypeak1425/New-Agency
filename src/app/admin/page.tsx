import { listUsersForAdmin } from "@/lib/admin";
import { hasActiveAccess } from "@/lib/billing";
import {
  suspendUserAction,
  reactivateUserAction,
  grantAccessAction,
  revokeAccessAction,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { cn } from "@/lib/cn";

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
  const users = await listUsersForAdmin();
  const smallButton = "px-3 py-1.5 text-xs";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl">Admin</h1>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-charcoal/60">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Account status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
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
                    <Badge tone={user.status === "active" ? "positive" : "negative"}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{user.subscription?.plan ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={active ? "positive" : "neutral"}>
                      {user.subscription?.status ?? "none"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.status === "active" ? (
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
                      ) : (
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
