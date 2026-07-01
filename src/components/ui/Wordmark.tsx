export function Wordmark({ withByline = false }: { withByline?: boolean }) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="font-serif text-xl font-semibold text-navy">
        Case <span className="text-gold">Atlas</span>
      </span>
      {withByline && (
        <span className="text-xs tracking-wide text-charcoal/60">
          by Peakbritt Financial Group
        </span>
      )}
    </span>
  );
}
