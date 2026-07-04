import Link from "next/link";
import { logInAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}) {
  const { error, next, reset } = await searchParams;

  return (
    <>
      <h1 className="text-2xl">Log in</h1>
      {reset && (
        <p className="mt-3 rounded-md bg-cream px-3 py-2 text-sm text-charcoal">
          Password reset. Log in with your new password.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={logInAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? "/app"} />
        <Input label="Email" name="email" type="email" required autoComplete="email" />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton pendingText="Logging in…" className="w-full">
          Log in
        </SubmitButton>
      </form>
      <div className="mt-6 space-y-2 text-sm text-charcoal/70">
        <p>
          <Link href="/forgot-password" className="text-navy hover:text-gold">
            Forgot password?
          </Link>
        </p>
        <p>
          No account?{" "}
          <Link href="/signup" className="text-navy hover:text-gold">
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}
