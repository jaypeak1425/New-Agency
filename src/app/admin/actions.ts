"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { AdminActionError, suspendUser, reactivateUser, grantAccess, revokeAccess } from "@/lib/admin";
import {
  WholesalerActionError,
  createWholesalerAccount,
  assignWholesaler,
  unassignWholesaler,
} from "@/lib/wholesaler";
import { SequenceError, processDueSequenceSends } from "@/lib/sequence";

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/app");
  return admin;
}

async function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
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

export async function createWholesalerAccountAction(formData: FormData) {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "") || undefined;
  const appBaseUrl = await getAppBaseUrl();

  try {
    await createWholesalerAccount(admin, email, name, appBaseUrl);
  } catch (error) {
    const message = error instanceof WholesalerActionError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function processSequenceSendsAction() {
  const admin = await requireAdmin();
  try {
    await processDueSequenceSends(admin);
  } catch (error) {
    const message = error instanceof SequenceError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function assignWholesalerAction(formData: FormData) {
  const admin = await requireAdmin();
  const wholesalerUserId = String(formData.get("wholesalerUserId") ?? "");

  try {
    if (!wholesalerUserId) {
      await unassignWholesaler(admin, targetUserId(formData));
    } else {
      await assignWholesaler(admin, targetUserId(formData), wholesalerUserId);
    }
  } catch (error) {
    const message = error instanceof WholesalerActionError ? error.message : "Something went wrong.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}
