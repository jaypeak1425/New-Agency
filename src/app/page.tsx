import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { buttonClassName } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/SubmitButton";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingFx } from "@/components/marketing/MarketingFx";
import { Starfield } from "@/components/marketing/Starfield";
import { AtlasTerminal } from "@/components/marketing/AtlasTerminal";
import { SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import { enrollInSequenceAction } from "./sequence-actions";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
  },
};

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

const MARQUEE = [
  "Business Succession",
  "Buy-Sell Funding",
  "Key-Person",
  "Executive Bonus",
  "Estate Architecture",
  "Premium Finance",
  "Wealth Replacement",
  "Pitch Decks",
];

// The Horizon-2039 hero headline, split into words for the cascade.
const HERO_LINE_1 = ["Every", "producer", "gets", "2026."];
const HERO_LINE_2 = ["You", "get"];

function MarqueeRun() {
  return (
    <span>
      {MARQUEE.map((m) => (
        <span key={m} className="inline-flex items-center gap-6 pr-6">
          <i /> {m}
        </span>
      ))}
    </span>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ enrolled?: string; sequenceError?: string }>;
}) {
  const { enrolled, sequenceError } = await searchParams;

  // Structured data for AI search and rich results: what the product is,
  // what it costs, and the FAQ — extractable by Google, Perplexity, and
  // ChatGPT search. Reuses the same FAQS the page renders so they never
  // drift.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        offers: {
          "@type": "Offer",
          price: "97",
          priceCurrency: "USD",
          description: "Monthly subscription with a 30-day money-back guarantee.",
        },
        publisher: {
          "@type": "Organization",
          name: "Peakbritt Financial Group",
          url: SITE_URL,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  let wordIndex = 0;

  return (
    <div className="flex min-h-full flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingFx />

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
        {/* Hero — Horizon 2039 */}
        <section
          id="mkt-hero"
          className="relative overflow-hidden bg-navy px-6 pb-24 pt-20 text-cream sm:pb-32 sm:pt-28"
          style={{
            background:
              "radial-gradient(120% 90% at 75% 8%, rgba(212,175,55,.14), transparent 55%), radial-gradient(80% 70% at 8% 100%, rgba(29,45,68,.95), transparent 65%), linear-gradient(180deg, #070d1e, #0b132b 55%, #070d1e)",
          }}
        >
          <Starfield />
          <div className="relative mx-auto max-w-4xl">
            <div className="mb-10 hidden items-center justify-between sm:flex">
              <span className="mkt-hud">
                CA // <b>CASE ENGINE</b> ONLINE
              </span>
              <span className="mkt-hud">
                A PEAKBRITT SOLUTION · HORIZON <b>2039</b>
              </span>
            </div>
            <span className="mkt-eyebrow">Case Atlas</span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.03] text-cream sm:text-6xl lg:text-7xl">
              {HERO_LINE_1.map((w) => (
                <span
                  key={w}
                  className="mkt-w"
                  style={{ transitionDelay: `${0.08 * wordIndex++}s` }}
                >
                  {w}&nbsp;
                </span>
              ))}
              <br />
              {HERO_LINE_2.map((w) => (
                <span
                  key={w}
                  className="mkt-w"
                  style={{ transitionDelay: `${0.08 * wordIndex++}s` }}
                >
                  {w}&nbsp;
                </span>
              ))}
              <span
                className="mkt-w italic text-gold"
                style={{ transitionDelay: `${0.08 * wordIndex++}s` }}
              >
                2039.
              </span>
            </h1>
            <p className="mkt-sub mt-7 max-w-xl text-lg text-cream/80">
              Type &ldquo;I&rsquo;ve got a guy.&rdquo; Get the full case design — strategy, pitch
              deck, illustrations needed, order of operations for the sales meeting. The system top
              producers spend a decade building, working for you today.
            </p>
            <div className="mkt-cta mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/signup" className={buttonClassName("primary")}>
                Try Case Atlas — $97/month
              </Link>
              <Link href="#atlas-live" className={buttonClassName("outline-on-dark")}>
                Watch Atlas think
              </Link>
            </div>
            <p className="mkt-cta mt-5 text-sm text-cream/60">
              30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
          <div className="mkt-cue" aria-hidden="true">
            <span className="mkt-line" />
            Descend
          </div>
        </section>

        {/* Marquee ticker */}
        <div className="mkt-marquee" aria-hidden="true">
          <div className="mkt-track">
            <MarqueeRun />
            <MarqueeRun />
          </div>
        </div>

        {/* Atlas live terminal — the product demonstrating itself */}
        <section
          id="atlas-live"
          className="relative overflow-hidden px-6 py-20 text-cream sm:py-28"
          style={{
            background:
              "radial-gradient(60% 90% at 85% 20%, rgba(212,175,55,.1), transparent 60%), linear-gradient(140deg, #0a1124, #0b132b 60%, #070d1e)",
          }}
        >
          <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
            <div data-reveal>
              <span className="mkt-eyebrow">Live Demonstration</span>
              <h2 className="mt-5 text-3xl text-cream sm:text-4xl">
                Watch a case design itself.
              </h2>
              <p className="mt-5 text-cream/80">
                You&rsquo;re in your car after the appointment. You have a thought:
                &ldquo;I&rsquo;ve got a guy.&rdquo; You open Case Atlas, answer 10 questions, and in
                60 seconds you have the strategy stack, the pitch order, the COI action, the
                wholesaler handoff, and the pitch deck.
              </p>
              <p className="mt-4 font-medium text-gold">
                The next meeting isn&rsquo;t a discovery call. It&rsquo;s a presentation.
              </p>
              <Link
                href="/signup"
                className={`mt-8 inline-flex ${buttonClassName("primary")}`}
              >
                Run your first case
              </Link>
            </div>
            <div data-reveal>
              <AtlasTerminal />
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-cream/30">
                Live simulation · actual product output is compliance-filtered
              </p>
            </div>
          </div>

          {/* Stats */}
          <div
            className="mx-auto mt-20 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4"
            data-stagger
          >
            <div className="mkt-stat">
              <div className="mkt-num">
                <span data-count="26">0</span>
              </div>
              <div className="mkt-lbl">Strategies Codified</div>
              <div className="mkt-txt">A locked library of advanced designs — never improvised.</div>
            </div>
            <div className="mkt-stat">
              <div className="mkt-num">
                <span data-count="9">0</span>
              </div>
              <div className="mkt-lbl">Hard Rules Enforced</div>
              <div className="mkt-txt">Tax-law guardrails checked on every single case.</div>
            </div>
            <div className="mkt-stat">
              <div className="mkt-num">
                <span data-count="100">0</span>
                <sup>%</sup>
              </div>
              <div className="mkt-lbl">Compliance-Filtered</div>
              <div className="mkt-txt">Every client-facing word passes the filter first.</div>
            </div>
            <div className="mkt-stat">
              <div className="mkt-num">
                <span data-count="60">0</span>
                <sup>s</sup>
              </div>
              <div className="mkt-lbl">To a Case Design</div>
              <div className="mkt-txt">From &ldquo;I&rsquo;ve got a guy&rdquo; to presentation-ready.</div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="bg-surface px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
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

        {/* Three-position */}
        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3" data-stagger>
            {THREE_POSITIONS.map((position) => (
              <Card key={position.title}>
                <h3 className="text-xl">{position.title}</h3>
                <p className="mt-2 text-sm text-charcoal/80">{position.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Avatars */}
        <section className="bg-surface px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl" data-reveal>
              Built for the producers you actually serve.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
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
          <div className="mx-auto max-w-2xl text-center" data-reveal>
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
        <section
          className="relative overflow-hidden px-6 py-20 text-cream"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(212,175,55,.14), transparent 60%), linear-gradient(180deg, #070d1e, #0b132b)",
          }}
        >
          <div className="relative mx-auto max-w-2xl text-center" data-reveal>
            <span className="mkt-eyebrow" style={{ justifyContent: "center" }}>
              Begin
            </span>
            <h2 className="mt-5 text-3xl text-cream sm:text-4xl">
              The future arrives either way. Arrive <span className="italic text-gold">equipped.</span>
            </h2>
            <p className="mt-4 text-cream/80">
              $97/month. Cancel anytime. Less than the cost of one missed opportunity in your book.
              If the engine finds one you would have missed, it paid for itself for years. If it
              doesn&rsquo;t in your first 30 days, we refund you — no questions asked.
            </p>
            <Link href="/signup" className={`mt-8 inline-flex ${buttonClassName("primary")}`}>
              Start your 30-day trial
            </Link>
          </div>
        </section>

        {/* Email sequence capture (docs/15-email-sequence.md) */}
        <section id="stay-in-the-loop" className="px-6 py-16">
          <div className="mx-auto max-w-xl text-center" data-reveal>
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
            <h2 className="text-center text-3xl" data-reveal>
              Questions
            </h2>
            <dl className="mt-10 space-y-8" data-stagger>
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

      <MarketingFooter />
    </div>
  );
}
