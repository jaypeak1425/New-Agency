import Link from "next/link";
import { unsubscribeFromSequence } from "@/lib/sequence";
import { Wordmark } from "@/components/ui/Wordmark";
import { Card } from "@/components/ui/Card";

// docs/15's sequence notes require one-click unsubscribe in every email —
// this is that click's landing page. Unsubscribing on GET is the standard
// email-client-safe pattern; the operation is idempotent.
export default async function SequenceUnsubscribePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enrollment = await unsubscribeFromSequence(id);

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-cream px-6 py-16">
      <Link href="/" className="mb-8">
        <Wordmark withByline />
      </Link>
      <Card className="w-full max-w-sm text-center">
        {enrollment ? (
          <>
            <h1 className="text-2xl">You&rsquo;re unsubscribed.</h1>
            <p className="mt-3 text-sm text-charcoal/70">
              No more emails from this sequence. If you change your mind, the story starts again on
              the home page.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl">Link not recognized.</h1>
            <p className="mt-3 text-sm text-charcoal/70">
              This unsubscribe link doesn&rsquo;t match an active enrollment — you may already be
              unsubscribed.
            </p>
          </>
        )}
        <p className="mt-6 text-sm">
          <Link href="/" className="text-navy hover:text-gold">
            Back to Case Atlas
          </Link>
        </p>
      </Card>
    </main>
  );
}
