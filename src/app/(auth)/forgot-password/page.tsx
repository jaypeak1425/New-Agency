import Link from "next/link";
import { requestPasswordResetAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <>
      <h1 className="text-2xl">Forgot password</h1>
      {sent ? (
        <p className="mt-6 text-sm text-charcoal/80">
          If an account exists for that email, a reset link has been sent.
        </p>
      ) : (
        <form action={requestPasswordResetAction} className="mt-6 space-y-4">
          <Input label="Email" name="email" type="email" required autoComplete="email" />
          <SubmitButton pendingText="Sending…" className="w-full">
            Send reset link
          </SubmitButton>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-navy hover:text-gold">
          Back to log in
        </Link>
      </p>
    </>
  );
}
