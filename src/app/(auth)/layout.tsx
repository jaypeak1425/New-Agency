import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { Card } from "@/components/ui/Card";

// Dark navy backdrop matching the PeakBritt marketing site's hero — logging
// in should feel like stepping through the same front door, not switching
// products.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-navy px-6 py-16">
      <Link href="/" className="mb-8">
        <Wordmark variant="dark" withByline />
      </Link>
      <Card className="w-full max-w-sm">{children}</Card>
    </main>
  );
}
