"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError, signUp, logIn, logOut, requestPasswordReset, resetPassword } from "@/lib/auth";

async function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "") || undefined;

  try {
    await signUp(email, password, name);
  } catch (error) {
    const message = error instanceof AuthError ? error.message : "Something went wrong.";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  redirect("/app");
}

export async function logInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  try {
    await logIn(email, password);
  } catch (error) {
    const message = error instanceof AuthError ? error.message : "Something went wrong.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  redirect(next.startsWith("/") ? next : "/app");
}

export async function logOutAction() {
  await logOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const appBaseUrl = await getAppBaseUrl();

  await requestPasswordReset(email, appBaseUrl);

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await resetPassword(token, password);
  } catch (error) {
    const message = error instanceof AuthError ? error.message : "Something went wrong.";
    redirect(`/reset-password/${token}?error=${encodeURIComponent(message)}`);
  }

  redirect("/login?reset=1");
}
