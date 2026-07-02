import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { hasImoSeatAccess } from "@/lib/imo";
import { needsOnboarding } from "@/lib/onboarding";
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

  // Wholesalers operate through /wholesaler — they're not paying customers
  // and don't go through onboarding (docs/23-wholesaler-assignment.md).
  if (user.role === "wholesaler") {
    redirect("/wholesaler");
  }
  // IMO principals operate through /imo-principal — a filtered view of their
  // own contract, not a seated agent (docs/08-master-dashboard.md section 5).
  if (user.role === "imo_principal") {
    redirect("/imo-principal");
  }

  // Admins operate through /admin, not as paying customers — everyone else
  // needs an active (or trialing) subscription, or an active IMO seat
  // (docs/08-master-dashboard.md section 7), to reach the dashboard.
  if (user.role !== "admin") {
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!hasActiveAccess(subscription?.status) && !hasImoSeatAccess(user)) {
      redirect("/billing");
    }
    if (await needsOnboarding(user.id, user.role)) {
      redirect("/onboarding");
    }
  }

  const imo = user.imoId ? await prisma.imo.findUnique({ where: { id: user.imoId } }) : null;

  return (
    <div className="flex min-h-full">
      <nav className="flex w-60 flex-col gap-6 bg-navy px-4 py-6 print:hidden">
        <div className="px-2">
          <Wordmark
            variant="dark"
            withByline={Boolean(imo?.byline)}
            logoUrl={imo?.logoUrl}
            accentColor={imo?.accentColor}
            byline={imo?.byline}
          />
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
      <main className="flex-1 bg-cream px-10 py-10 print:bg-white print:p-0">{children}</main>
    </div>
  );
}
