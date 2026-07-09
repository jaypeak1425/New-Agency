import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { AGENT_ANNUAL_PLAN } from "@/lib/stripe";
import { isMonthlyBillingConfigured, isAnnualBillingConfigured } from "@/lib/launch";
import { startCheckoutAction, openBillingPortalAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Wordmark } from "@/components/ui/Wordmark";
import { Card } from "@/components/ui/Card";

function planLabel(plan: string | undefined) {
  if (plan === AGENT_ANNUAL_PLAN) return "$2,970/year";
  if (plan === "comped") return "comped by an admin";
  return "$297/month";
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "wholesaler") redirect("/wholesaler");
  if (user.role === "imo_principal") redirect("/imo-principal");
  // Approval gate: nobody pays before Jay signs off on the account.
  if (user.role !== "admin" && user.status === "pending") redirect("/pending-approval");

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 py-16">
      <Link href="/" className="mb-8">
        <Wordmark withByline />
      </Link>
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl">Billing</h1>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {hasActiveAccess(subscription?.status) ? (
          <>
            <p className="mt-3 text-sm text-charcoal/80">
              Your subscription is <span className="font-medium">{subscription?.status}</span> —{" "}
              {planLabel(subscription?.plan)}.
            </p>
            {subscription?.stripeCustomerId ? (
              <form action={openBillingPortalAction} className="mt-6">
                <SubmitButton pendingText="Opening…" className="w-full">
                  Manage billing
                </SubmitButton>
              </form>
            ) : (
              <p className="mt-6 text-sm text-charcoal/70">
                Access was granted by an admin — there&rsquo;s no Stripe billing portal for this
                account.
              </p>
            )}
          </>
        ) : isMonthlyBillingConfigured() ? (
          <>
            <p className="mt-3 text-sm text-charcoal/80">
              Subscribe to unlock the dashboard.
            </p>
            <form action={startCheckoutAction} className="mt-6">
              <input type="hidden" name="planKey" value="monthly" />
              <SubmitButton pendingText="Redirecting…" className="w-full">
                Subscribe — $297/month
              </SubmitButton>
            </form>
            {isAnnualBillingConfigured() && (
              <form action={startCheckoutAction} className="mt-3">
                <input type="hidden" name="planKey" value="annual" />
                <SubmitButton variant="outline" pendingText="Redirecting…" className="w-full">
                  Subscribe — $2,970/year (save ~17%)
                </SubmitButton>
              </form>
            )}
          </>
        ) : (
          // Phase A pilot mode (docs/24-railway-launch-runbook.md): Stripe
          // isn't configured yet, so self-serve signup is off and access is
          // comped by an admin — the business plan's design-partner months.
          <p className="mt-3 text-sm text-charcoal/80">
            Case Atlas is in its pilot right now — access is granted by the Peakbritt team rather
            than self-serve billing. If you&rsquo;re expecting access and don&rsquo;t have it yet,
            reply to your invite and we&rsquo;ll switch you on.
          </p>
        )}
        <p className="mt-6 text-sm">
          <Link href="/app" className="text-navy hover:text-gold">
            Back to dashboard
          </Link>
        </p>
      </Card>
    </main>
  );
}
