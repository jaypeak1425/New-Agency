import Link from "next/link";
import { signUpAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl">Apply for access</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Case Atlas is by approval — we review every producer personally. Create your account
        and you&rsquo;ll hear back within a business day.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={signUpAction} className="mt-6 space-y-4">
        <Input label="Name" name="name" type="text" autoComplete="name" />
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <SubmitButton pendingText="Creating account…" className="w-full">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-charcoal/70">
        Already have an account?{" "}
        <Link href="/login" className="text-navy hover:text-gold">
          Log in
        </Link>
      </p>
    </>
  );
}
