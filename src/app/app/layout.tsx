import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { hasImoSeatAccess } from "@/lib/imo";
import { needsOnboarding } from "@/lib/onboarding";
import { logOutAction } from "../(auth)/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { AppNav } from "@/components/AppNav";
import { AppShell } from "@/components/AppShell";
import { Wordmark } from "@/components/ui/Wordmark";
import type { Metadata } from "next";

// The authenticated app is private — keep it out of search indexes (robots.ts
// also disallows the whole /app tree; this is belt-and-suspenders).
export const metadata: Metadata = { robots: { index: false, follow: false } };

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
    // Approval gate first: a pending signup sees nothing proprietary — not
    // the dashboard, not billing, not onboarding — until an admin approves.
    if (user.status === "pending") {
      redirect("/pending-approval");
    }
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
    <AppShell
      brand={
        <Wordmark
          variant="dark"
          withByline={Boolean(imo?.byline)}
          logoUrl={imo?.logoUrl}
          accentColor={imo?.accentColor}
          byline={imo?.byline}
        />
      }
      nav={<AppNav />}
      footer={
        <>
          <p className="truncate text-cream/70">{user.email}</p>
          <form action={logOutAction}>
            <SubmitButton variant="outline-on-dark" pendingText="Logging out…" className="w-full">
              Log out
            </SubmitButton>
          </form>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
