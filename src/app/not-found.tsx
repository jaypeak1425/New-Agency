import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-4">
        <Link href="/" className="text-navy hover:text-gold">
          Back to home
        </Link>
      </p>
    </main>
  );
}
