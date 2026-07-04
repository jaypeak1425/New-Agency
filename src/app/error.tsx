"use client";

// Self-contained error boundary for the skeleton (the branded Button
// component returns with the design-system slice).
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-4 text-charcoal/80">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-light"
      >
        Try again
      </button>
    </main>
  );
}
