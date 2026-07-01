import { listUsersForAdmin } from "@/lib/admin";
import { hasActiveAccess } from "@/lib/billing";
import {
  suspendUserAction,
  reactivateUserAction,
  grantAccessAction,
  revokeAccessAction,
} from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const users = await listUsersForAdmin();

  return (
    <main style={{ maxWidth: 960, margin: "3rem auto", fontFamily: "sans-serif" }}>
      <h1>Admin</h1>
      {error && <p role="alert">{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Email</th>
            <th align="left">Role</th>
            <th align="left">Account status</th>
            <th align="left">Plan</th>
            <th align="left">Subscription</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const active = hasActiveAccess(user.subscription?.status);
            return (
              <tr key={user.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{user.subscription?.plan ?? "—"}</td>
                <td>{user.subscription?.status ?? "none"}</td>
                <td style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0" }}>
                  {user.status === "active" ? (
                    <form action={suspendUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit">Suspend</button>
                    </form>
                  ) : (
                    <form action={reactivateUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit">Reactivate</button>
                    </form>
                  )}
                  {active ? (
                    <form action={revokeAccessAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit">Revoke access</button>
                    </form>
                  ) : (
                    <form action={grantAccessAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit">Grant access</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
