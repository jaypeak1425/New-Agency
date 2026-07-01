import { signUpAction } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Sign up</h1>
      {error && <p role="alert">{error}</p>}
      <form action={signUpAction}>
        <div>
          <label>
            Name
            <br />
            <input type="text" name="name" autoComplete="name" />
          </label>
        </div>
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
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
        </div>
        <button type="submit">Create account</button>
      </form>
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}
