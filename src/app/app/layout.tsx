import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { logOutAction } from "../(auth)/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { AppNav } from "@/components/AppNav";
import { Wordmark } from "@/components/ui/Wordmark";

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
    <div className="flex min-h-full">
      <nav className="flex w-60 flex-col gap-6 bg-navy px-4 py-6">
        <div className="px-2">
          <Wordmark variant="dark" />
        </div>
        <AppNav />
        <div className="mt-auto space-y-3 border-t border-cream/10 px-2 pt-4 text-sm">
          <p className="truncate text-cream/70">{user.email}</p>
          <form action={logOutAction}>
            <SubmitButton variant="outline-on-dark" pendingText="Logging out…" className="w-full">
              Log out
            </SubmitButton>
          </form>
        </div>
      </nav>
      <main className="flex-1 bg-cream px-10 py-10">{children}</main>
    </div>
  );
}
