import { cn } from "@/lib/cn";

// The Case Atlas wordmark lockup, matching Case_Atlas_Brand_Guidelines and
// the CA-starburst logo: "CASE" in the on-surface color, "ATLAS" in
// Prestige Gold, preceded by the gold starburst accent, in Montserrat with
// wide tracking. Rendered as crisp text so it stays sharp at every size and
// honors the brand's light/dark rule (navy on light, cream/gold on dark) —
// something a single raster can't do.
//
// docs/00-developer-brief.md's white-label branding engine still applies: an
// IMO can override the logo image, accent color, and byline a seated agent
// sees (src/app/app/layout.tsx passes these through).

function StarburstAccent({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.5 L13.9 9.4 L21.8 11.3 L13.9 13.2 L12 21.1 L10.1 13.2 L2.2 11.3 L10.1 9.4 Z" />
    </svg>
  );
}

export function Wordmark({
  withByline = false,
  variant = "light",
  logoUrl,
  accentColor,
  byline,
}: {
  withByline?: boolean;
  variant?: "light" | "dark";
  logoUrl?: string | null;
  accentColor?: string | null;
  byline?: string | null;
}) {
  const bylineClass = cn(
    "mt-0.5 text-[10px] uppercase tracking-[0.18em]",
    variant === "light" ? "text-steel" : "text-cream/60",
  );

  if (logoUrl) {
    return (
      <span className="inline-flex flex-col leading-tight">
        {/* eslint-disable-next-line @next/next/no-img-element -- IMO-supplied external URL, not a local/optimizable asset */}
        <img src={logoUrl} alt={byline ?? "White-label partner logo"} className="h-8 w-auto" />
        {withByline && byline && <span className={bylineClass}>{byline}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col leading-tight">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-serif text-lg font-semibold uppercase tracking-[0.16em]",
          variant === "light" ? "text-navy" : "text-cream",
        )}
      >
        <StarburstAccent
          className={cn("h-3 w-3 flex-shrink-0", !accentColor && "text-gold")}
          {...(accentColor ? { style: { color: accentColor } } : {})}
        />
        <span>
          Case{" "}
          <span
            className={accentColor ? undefined : "text-gold"}
            style={accentColor ? { color: accentColor } : undefined}
          >
            Atlas
          </span>
        </span>
      </span>
      {withByline && <span className={bylineClass}>{byline ?? "A PeakBritt Solution"}</span>}
    </span>
  );
}
