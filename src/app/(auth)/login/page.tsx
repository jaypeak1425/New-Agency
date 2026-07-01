import { logInAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}) {
  const { error, next, reset } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Log in</h1>
      {reset && <p>Password reset. Log in with your new password.</p>}
      {error && <p role="alert">{error}</p>}
      <form action={logInAction}>
        <input type="hidden" name="next" value={next ?? "/app"} />
        <div>
          <label>
            Email
            <br />
            <input type="email" name="email" required autoComplete="email" />
          </label>
        </div>
        <div>
          <label>
            Password
            <br />
            <input type="password" name="password" required autoComplete="current-password" />
          </label>
        </div>
        <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      </form>
      <p>
        <a href="/forgot-password">Forgot password?</a>
      </p>
      <p>
        No account? <a href="/signup">Sign up</a>
      </p>
    </main>
  );
}
