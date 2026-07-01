import { resetPasswordAction } from "../../actions";

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
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Reset password</h1>
      {error && <p role="alert">{error}</p>}
      <form action={resetPasswordAction}>
        <input type="hidden" name="token" value={token} />
        <div>
          <label>
            New password
            <br />
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
        </div>
        <button type="submit">Reset password</button>
      </form>
    </main>
  );
}
