"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  ImoActionError,
  createImo,
  updateImoSeats,
  assignAgentToImo,
  unassignAgentFromImo,
} from "@/lib/imo";
import type { ImoOrgType } from "@/generated/prisma/client";

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/app");
  return admin;
}

export async function createImoAction(formData: FormData) {
  const admin = await requireAdmin();

  try {
    await createImo(admin, {
      name: String(formData.get("name") ?? ""),
      organizationType: String(formData.get("organizationType") ?? "imo") as ImoOrgType,
      primaryContactName: String(formData.get("primaryContactName") ?? ""),
      primaryContactEmail: String(formData.get("primaryContactEmail") ?? ""),
      seatsPurchased: Number(formData.get("seatsPurchased") ?? 0),
      contractTerms: String(formData.get("contractTerms") ?? ""),
    });
  } catch (error) {
    const message = error instanceof ImoActionError ? error.message : "Something went wrong.";
    redirect(`/admin/imos?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/imos");
}

export async function updateImoSeatsAction(formData: FormData) {
  const admin = await requireAdmin();
  const imoId = String(formData.get("imoId") ?? "");
  const seatsPurchased = Number(formData.get("seatsPurchased") ?? 0);

  try {
    await updateImoSeats(admin, imoId, seatsPurchased);
  } catch (error) {
    const message = error instanceof ImoActionError ? error.message : "Something went wrong.";
    redirect(`/admin/imos?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/imos");
}

export async function assignAgentToImoAction(formData: FormData) {
  const admin = await requireAdmin();
  const agentUserId = String(formData.get("agentUserId") ?? "");
  const imoId = String(formData.get("imoId") ?? "");

  try {
    if (!imoId) {
      await unassignAgentFromImo(admin, agentUserId);
    } else {
      await assignAgentToImo(admin, agentUserId, imoId);
    }
  } catch (error) {
    const message = error instanceof ImoActionError ? error.message : "Something went wrong.";
    redirect(`/admin/imos?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/imos");
}
