import { redirect } from "next/navigation";
import { syncSubscriptionFromCheckoutSession } from "@/lib/billing";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/billing");

  await syncSubscriptionFromCheckoutSession(sessionId);
  redirect("/app");
}
