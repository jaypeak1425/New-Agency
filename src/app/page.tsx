import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { buttonClassName } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";
import { enrollInSequenceAction } from "./sequence-actions";

const AVATARS = [
  {
    name: "High Net Worth",
    detail: "$2M+ net worth, complex estates, family wealth.",
  },
  {
    name: "Business Owner",
    detail: "C-Corp, S-Corp, partnership, LLC with employees.",
  },
  {
    name: "Qualified Fund Heavy",
    detail: "$500K+ in IRA/401(k), often pre-retiree.",
  },
  {
    name: "Family / Legacy",
    detail: "Dependents, income protection, legacy for kids or grandkids.",
  },
];

const THREE_POSITIONS = [
  {
    title: "Recruiting",
    body: "A case-design brain that helps you win business you'd otherwise miss — the system top producers have that you don't, yet.",
  },
  {
    title: "Retention",
    body: "Once you've run a real “I've got a guy” scenario through Atlas, going back to guessing isn't an option.",
  },
  {
    title: "Revenue",
    body: "Built to scale — IMOs and BGAs will be able to white-label Case Atlas for their whole downline.",
  },
];

const FAQS = [
  {
    q: "Is this a software product?",
    a: "Yes. You log in, type or speak your scenario, and Atlas returns a full case design. You can also build pitch decks, send wholesaler handoffs, and track your pipeline in the dashboard.",
  },
  {
    q: "Is the engine AI?",
    a: "Yes, but with guardrails. The engine reasons from a locked, curated strategy library — it never invents. Every client-facing output passes through a compliance filter before delivery.",
  },
  {
    q: "Does the engine replace my wholesaler?",
    a: "No. The engine builds the case design and writes the handoff email. Your wholesaler still provides the actual illustrations, product knowledge, and carrier relationships.",
  },
  {
    q: "What if I don't find an opportunity in my first 30 days?",
    a: "We refund you. No questions asked. This isn't a free month — it's a money-back guarantee on the subscription.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ enrolled?: string; sequenceError?: string }>;
}) {
  const { enrolled, sequenceError } = await searchParams;
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Wordmark />
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

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-navy px-6 py-20 text-cream">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold text-cream sm:text-5xl">
              The strategy engine for the producer who&rsquo;s done guessing.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-cream/80">
              Type &ldquo;I&rsquo;ve got a guy.&rdquo; Get the full case design — strategy, pitch
              deck, illustrations needed, order of operations for the sales meeting.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/signup" className={buttonClassName("primary")}>
                Try Case Atlas — $97/month
              </Link>
              <Link href="#how-it-works" className={buttonClassName("outline-on-dark")}>
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-sm text-cream/60">30-day money-back guarantee. Cancel anytime.</p>
          </div>
        </section>

        {/* Three-position */}
        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {THREE_POSITIONS.map((position) => (
              <Card key={position.title}>
                <h3 className="text-xl">{position.title}</h3>
                <p className="mt-2 text-sm text-charcoal/80">{position.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Problem */}
        <section className="bg-surface px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl">
              You&rsquo;re at $100K. The producers at $1M aren&rsquo;t smarter than you.
            </h2>
            <p className="mt-4 text-charcoal/80">
              They have a system — a brain that thinks like a top producer on every call. The
              producers stuck at $100K wing it every time: call the wholesaler, wait two days, get
              back an illustration, and try to close on the relationship. The gap between a $100K
              producer and a $1M producer isn&rsquo;t talent. It&rsquo;s system.
            </p>
          </div>
        </section>

        {/* The moment */}
        <section id="how-it-works" className="px-6 py-16">
          <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
            <div>
              <h2 className="text-3xl">Imagine you just left an appointment.</h2>
              <p className="mt-4 text-charcoal/80">
                You&rsquo;re in your car. You have a thought: &ldquo;I&rsquo;ve got a
                guy.&rdquo; You open Case Atlas. Atlas asks you 10 questions. You answer. In 60
                seconds, you get the strategy stack, the pitch order, the COI action, the
                wholesaler handoff, and the pitch deck — ready for the next meeting.
              </p>
              <p className="mt-4 font-medium text-navy">
                The next meeting isn&rsquo;t a discovery call. It&rsquo;s a presentation.
              </p>
            </div>
            <Card variant="dark">
              <p className="font-mono text-sm text-cream/70">You</p>
              <p className="mt-1 text-sm">
                Two owners, 50 and 49, C-Corp, two key employees, average to good health. Want to
                set up a buy-sell and put money aside in a company reserve.
              </p>
              <p className="mt-4 font-mono text-sm text-gold">Atlas</p>
              <p className="mt-1 text-sm text-cream/90">
                Got it. Let&rsquo;s walk through a few questions, then I&rsquo;ll put together the
                case design.
              </p>
            </Card>
          </div>
        </section>

        {/* Avatars */}
        <section className="bg-surface px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl">Built for the producers you actually serve.</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {AVATARS.map((avatar) => (
                <Card key={avatar.name}>
                  <h3 className="text-lg">{avatar.name}</h3>
                  <p className="mt-2 text-sm text-charcoal/80">{avatar.detail}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl">Compliance built in, not bolted on.</h2>
            <p className="mt-4 text-charcoal/80">
              &ldquo;Non-taxable,&rdquo; not &ldquo;tax-free.&rdquo; Every benefit claim conditioned
              on the policy remaining in force. No outcome quantification in client copy. The
              engine never invents — it only recommends from a locked, curated strategy library.
              Every output passes through a compliance filter before it reaches you or your
              client.
            </p>
          </div>
        </section>

        {/* Price */}
        <section className="bg-navy px-6 py-16 text-cream">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl text-cream">$97/month. Cancel anytime.</h2>
            <p className="mt-4 text-cream/80">
              Less than the cost of one missed opportunity in your book. If the engine finds one
              you would have missed, it paid for itself for years. If it doesn&rsquo;t in your
              first 30 days, we refund you — no questions asked.
            </p>
            <Link href="/signup" className={`mt-8 inline-flex ${buttonClassName("primary")}`}>
              Start your 30-day trial
            </Link>
          </div>
        </section>

        {/* Email sequence capture (docs/15-email-sequence.md) */}
        <section id="stay-in-the-loop" className="px-6 py-16">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl">Not ready yet? Hear the whole story first.</h2>
            <p className="mt-4 text-sm text-charcoal/80">
              Seven short emails from Jay on why producers get stuck at $100K — and the system the
              ones who break through actually use. No pitch until the end. Unsubscribe anytime.
            </p>
            {enrolled ? (
              <p className="mt-6 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-navy">
                You&rsquo;re in. The first email is on its way.
              </p>
            ) : (
              <form
                action={enrollInSequenceAction}
                className="mx-auto mt-6 flex max-w-md items-center gap-2"
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@youragency.com"
                  className="block w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <SubmitButton pendingText="Joining…" className="whitespace-nowrap">
                  Get the emails
                </SubmitButton>
              </form>
            )}
            {sequenceError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {sequenceError}
              </p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-3xl">Questions</h2>
            <dl className="mt-10 space-y-8">
              {FAQS.map((faq) => (
                <div key={faq.q}>
                  <dt className="font-medium text-navy">{faq.q}</dt>
                  <dd className="mt-1 text-sm text-charcoal/80">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-8 text-xs text-charcoal/60">
        <div className="mx-auto max-w-5xl space-y-2">
          <p>
            Case Atlas is a software product. It does not provide tax, legal, or investment
            advice.
          </p>
          <p>
            All benefit claims non-taxable while the policy remains in force. Final strategy
            subject to underwriting and client decision.
          </p>
          <p>Past case results do not guarantee future commissions or production.</p>
          <p>
            Peakbritt Financial Group is not a CPA firm, law firm, or registered investment
            advisor. COI relationships are the responsibility of the agent.
          </p>
          <p className="pt-2">&copy; {new Date().getFullYear()} Peakbritt Financial Group.</p>
        </div>
      </footer>
    </div>
  );
}
