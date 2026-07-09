import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logOutAction } from "../(auth)/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Wordmark } from "@/components/ui/Wordmark";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application in review",
  robots: { index: false, follow: false },
};

// The holding room for the approval gate: a self-serve signup lands here and
// stays here until an admin approves the account (src/lib/admin.ts
// approveUser). Nothing proprietary renders on this page.
export default async function PendingApprovalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.status !== "pending") redirect("/app");

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-navy px-6 py-16">
      <Link href="/" className="mb-8">
        <Wordmark variant="dark" withByline />
      </Link>
      <Card className="w-full max-w-md">
        <p className="text-xs font-medium uppercase tracking-wide text-gold">
          Application received
        </p>
        <h1 className="mt-2 text-2xl">Your account is in review.</h1>
        <p className="mt-3 text-sm text-charcoal/80">
          Access to Case Atlas is by approval — we review every producer personally before
          opening the platform. You&rsquo;ll get an email at{" "}
          <span className="font-medium">{user.email}</span> as soon as you&rsquo;re in.
        </p>
        <p className="mt-3 text-sm text-charcoal/60">
          No action is needed from you in the meantime. This usually takes less than a
          business day.
        </p>
        <form action={logOutAction} className="mt-6">
          <SubmitButton variant="outline" pendingText="Logging out…" className="w-full">
            Log out
          </SubmitButton>
        </form>
      </Card>
    </main>
  );
}
