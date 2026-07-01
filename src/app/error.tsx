"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. Try again, or head back to the dashboard.</p>
      <button onClick={reset}>Try again</button>
      <p>
        <a href="/app">Back to dashboard</a>
      </p>
    </main>
  );
}
