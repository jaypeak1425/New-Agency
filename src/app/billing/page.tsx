import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { startCheckoutAction, openBillingPortalAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Wordmark } from "@/components/ui/Wordmark";
import { Card } from "@/components/ui/Card";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "wholesaler") redirect("/wholesaler");

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 py-16">
      <Link href="/" className="mb-8">
        <Wordmark withByline />
      </Link>
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl">Billing</h1>
        {hasActiveAccess(subscription?.status) ? (
          <>
            <p className="mt-3 text-sm text-charcoal/80">
              Your subscription is <span className="font-medium">{subscription?.status}</span>.
              $97/month.
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
        ) : (
          <>
            <p className="mt-3 text-sm text-charcoal/80">
              Subscribe for $97/month to unlock the dashboard.
            </p>
            <form action={startCheckoutAction} className="mt-6">
              <SubmitButton pendingText="Redirecting…" className="w-full">
                Subscribe — $97/month
              </SubmitButton>
            </form>
          </>
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
