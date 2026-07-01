// Minimal email stub for Phase 1. No email provider is wired up yet — swap the
// body of this function for a real provider (Resend, Postmark, Supabase, etc.)
// when one is chosen. Logging the link keeps the reset flow testable without
// live credentials.
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  console.log(`[email:dev] Password reset for ${to}: ${resetUrl}`);
}
