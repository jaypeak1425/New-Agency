// Slice 1 — bare skeleton landing. The full marketing site (hero, avatars,
// three-position messaging, FAQ, SEO) returns in a later slice; this exists
// only to prove Railway can build and serve the Next 16 / Node 20 / Nixpacks
// toolchain from this repo before any app, database, or middleware is
// reintroduced. See docs/26-incremental-deploy.md.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-widest text-gold">Peakbritt Financial Group</p>
      <h1 className="mt-4 font-serif text-4xl text-navy">Case Atlas</h1>
      <p className="mt-4 text-sm text-charcoal/70">
        Bringing the platform online in phases. This is the framework skeleton — the strategy
        engine reconnects one verified slice at a time.
      </p>
    </main>
  );
}
