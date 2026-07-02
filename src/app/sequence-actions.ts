"use server";

import { redirect } from "next/navigation";
import { SequenceError, enrollInSequence } from "@/lib/sequence";

export async function enrollInSequenceAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");

  try {
    await enrollInSequence(email);
  } catch (error) {
    const message = error instanceof SequenceError ? error.message : "Something went wrong.";
    redirect(`/?sequenceError=${encodeURIComponent(message)}#stay-in-the-loop`);
  }
  redirect("/?enrolled=1#stay-in-the-loop");
}
