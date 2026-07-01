"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ComplianceQueueError, flagStrategyForPreLaunchReview } from "@/lib/compliance-queue";

export async function flagStrategyForReviewAction(formData: FormData) {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/app");

  const strategyId = String(formData.get("strategyId") ?? "");

  try {
    await flagStrategyForPreLaunchReview(admin, strategyId);
  } catch (error) {
    const message = error instanceof ComplianceQueueError ? error.message : "Something went wrong.";
    redirect(`/admin/strategies?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/strategies");
}
