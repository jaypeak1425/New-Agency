import { resetPasswordAction } from "../../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Input } from "@/components/ui/Input";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl">Reset password</h1>
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={resetPasswordAction} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <Input
          label="New password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <SubmitButton pendingText="Resetting…" className="w-full">
          Reset password
        </SubmitButton>
      </form>
    </>
  );
}
