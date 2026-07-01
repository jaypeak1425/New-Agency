import { requestPasswordResetAction } from "../actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Forgot password</h1>
      {sent ? (
        <p>If an account exists for that email, a reset link has been sent.</p>
      ) : (
        <form action={requestPasswordResetAction}>
          <div>
            <label>
              Email
              <br />
              <input type="email" name="email" required autoComplete="email" />
            </label>
          </div>
          <button type="submit">Send reset link</button>
        </form>
      )}
      <p>
        <a href="/login">Back to log in</a>
      </p>
    </main>
  );
}
