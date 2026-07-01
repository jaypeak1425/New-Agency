import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/billing";
import { startCheckoutAction, openBillingPortalAction } from "./actions";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Billing</h1>
      {hasActiveAccess(subscription?.status) ? (
        <>
          <p>Your subscription is {subscription?.status}. $97/month.</p>
          {subscription?.stripeCustomerId ? (
            <form action={openBillingPortalAction}>
              <button type="submit">Manage billing</button>
            </form>
          ) : (
            <p>Access was granted by an admin — there&rsquo;s no Stripe billing portal for this account.</p>
          )}
        </>
      ) : (
        <>
          <p>Subscribe for $97/month to unlock the dashboard.</p>
          <form action={startCheckoutAction}>
            <button type="submit">Subscribe — $97/month</button>
          </form>
        </>
      )}
      <p>
        <a href="/app">Back to dashboard</a>
      </p>
    </main>
  );
}
