import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { Card } from "@/components/ui/Card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 py-16">
      <Link href="/" className="mb-8">
        <Wordmark withByline />
      </Link>
      <Card className="w-full max-w-sm">{children}</Card>
    </main>
  );
}
