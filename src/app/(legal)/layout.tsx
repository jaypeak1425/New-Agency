import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { buttonClassName } from "@/components/ui/button-styles";
import { MarketingFooter } from "@/components/MarketingFooter";

// Public legal pages (Terms, Privacy, Accuracy & Disclosures) share the
// marketing header/footer chrome and a readable prose column.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-navy hover:text-gold">
              Log in
            </Link>
            <Link href="/signup" className={buttonClassName("primary")}>
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 py-12">
        <article className="mx-auto max-w-3xl">{children}</article>
      </main>
      <MarketingFooter />
    </div>
  );
}
