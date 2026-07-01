import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { logOutAction } from "../(auth)/actions";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/scenarios", label: "Scenarios" },
  { href: "/app/pipeline", label: "Pipeline" },
  { href: "/app/prospects", label: "Prospects" },
  { href: "/app/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // The proxy already redirects unauthenticated requests, but a suspended
  // account or a stale session pointing at a deleted user has no valid User
  // row to render here — bounce to login rather than crash.
  if (!user) {
    redirect("/login");
  }

  // Admins operate through /admin, not as paying customers — everyone else
  // needs an active (or trialing) subscription to reach the dashboard.
  if (user.role !== "admin") {
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!hasActiveAccess(subscription?.status)) {
      redirect("/billing");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <nav
        style={{
          width: 200,
          borderRight: "1px solid #ddd",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <strong>Case Atlas</strong>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <div style={{ marginTop: "auto", fontSize: "0.85rem" }}>
          <p>{user.email}</p>
          <form action={logOutAction}>
            <button type="submit">Log out</button>
          </form>
        </div>
      </nav>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}
