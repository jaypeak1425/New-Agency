"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BookImportError, importBookCsv, startCaseFromBookClient } from "@/lib/book-import";

const MAX_FILE_BYTES = 1_000_000; // 1MB is thousands of rows — plenty.

export async function importBookAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/app/book?error=${encodeURIComponent("Choose a CSV file first.")}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    redirect(`/app/book?error=${encodeURIComponent("That file is over 1MB — split it and import in batches.")}`);
  }

  let summary: { imported: number; skipped: Array<{ row: number; reason: string }> };
  try {
    summary = await importBookCsv(user, await file.text());
  } catch (error) {
    const message = error instanceof BookImportError ? error.message : "Something went wrong reading that file.";
    redirect(`/app/book?error=${encodeURIComponent(message)}`);
  }
  redirect(`/app/book?imported=${summary.imported}&skipped=${summary.skipped.length}`);
}

export async function startCaseFromBookAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookClientId = String(formData.get("bookClientId") ?? "");
  let scenarioId: string;
  try {
    scenarioId = await startCaseFromBookClient(user, bookClientId);
  } catch (error) {
    const message = error instanceof BookImportError ? error.message : "Something went wrong.";
    redirect(`/app/book?error=${encodeURIComponent(message)}`);
  }
  redirect(`/app/scenarios/${scenarioId}/intake`);
}
