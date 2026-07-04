// Minimal typographic primitives for the legal pages — keeps Terms,
// Privacy, and Disclosures visually consistent without pulling in a prose
// plugin.

export function LegalTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-serif text-3xl text-navy">{children}</h1>;
}

export function LegalUpdated({ date }: { date: string }) {
  return <p className="mt-2 text-xs text-charcoal/50">Last updated: {date}</p>;
}

export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-charcoal/70">
      {children}
    </p>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-lg font-medium text-navy">{children}</h2>;
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{children}</p>;
}

export function LegalUL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-charcoal/80">{children}</ul>;
}
