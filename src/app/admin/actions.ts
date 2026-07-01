"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminActionError, suspendUser, reactivateUser, grantAccess, revokeAccess } from "@/lib/admin";

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/app");
  return admin;
}

function targetUserId(formData: FormData) {
  return String(formData.get("userId") ?? "");
}

export async function suspendUserAction(formData: FormData) {
  const admin = await requireAdmin();
  try {
    await suspendUser(admin, targetUserId(formData));
  } catch (error) {
    const message = error instanceof AdminActionError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function reactivateUserAction(formData: FormData) {
  const admin = await requireAdmin();
  try {
    await reactivateUser(admin, targetUserId(formData));
  } catch (error) {
    const message = error instanceof AdminActionError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function grantAccessAction(formData: FormData) {
  const admin = await requireAdmin();
  try {
    await grantAccess(admin, targetUserId(formData));
  } catch (error) {
    const message = error instanceof AdminActionError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function revokeAccessAction(formData: FormData) {
  const admin = await requireAdmin();
  try {
    await revokeAccess(admin, targetUserId(formData));
  } catch (error) {
    const message = error instanceof AdminActionError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}
