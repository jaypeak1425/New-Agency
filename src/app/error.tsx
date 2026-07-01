"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-4 text-charcoal/80">
        An unexpected error occurred. Try again, or head back to the dashboard.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
      <p className="mt-4">
        <a href="/app" className="text-navy hover:text-gold">
          Back to dashboard
        </a>
      </p>
    </main>
  );
}
