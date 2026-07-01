"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ComplianceQueueError, runPeriodicAudit, resolveComplianceFlag } from "@/lib/compliance-queue";
import type { ComplianceFlagStatus } from "@/generated/prisma/client";

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/app");
  return admin;
}

export async function runPeriodicAuditAction() {
  const admin = await requireAdmin();

  try {
    await runPeriodicAudit(admin);
  } catch (error) {
    const message = error instanceof ComplianceQueueError ? error.message : "Something went wrong.";
    redirect(`/admin/compliance?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/compliance");
}

export async function resolveComplianceFlagAction(formData: FormData) {
  const admin = await requireAdmin();
  const flagId = String(formData.get("flagId") ?? "");
  const resolution = String(formData.get("resolution") ?? "") as ComplianceFlagStatus;
  const resolutionNotes = String(formData.get("resolutionNotes") ?? "") || null;

  try {
    await resolveComplianceFlag(admin, flagId, resolution, resolutionNotes);
  } catch (error) {
    const message = error instanceof ComplianceQueueError ? error.message : "Something went wrong.";
    redirect(`/admin/compliance?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/compliance");
}
