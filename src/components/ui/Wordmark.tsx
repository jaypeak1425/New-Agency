import { cn } from "@/lib/cn";

// docs/00-developer-brief.md's white-label branding engine: an IMO can
// override the logo, accent color, and byline that a seated agent sees in
// the nav (src/app/app/layout.tsx passes these through). No override =
// default Case Atlas / Peakbritt Financial Group branding.
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
  if (logoUrl) {
    return (
      <span className="inline-flex flex-col leading-tight">
        {/* eslint-disable-next-line @next/next/no-img-element -- IMO-supplied external URL, not a local/optimizable asset */}
        <img src={logoUrl} alt={byline ?? "White-label partner logo"} className="h-8 w-auto" />
        {withByline && byline && (
          <span
            className={cn(
              "mt-1 text-xs tracking-wide",
              variant === "light" ? "text-charcoal/60" : "text-cream/60",
            )}
          >
            {byline}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col leading-tight">
      <span
        className={cn(
          "font-serif text-xl font-semibold",
          variant === "light" ? "text-navy" : "text-cream",
        )}
      >
        Case{" "}
        <span className={accentColor ? undefined : "text-gold"} style={accentColor ? { color: accentColor } : undefined}>
          Atlas
        </span>
      </span>
      {withByline && (
        <span
          className={cn(
            "text-xs tracking-wide",
            variant === "light" ? "text-charcoal/60" : "text-cream/60",
          )}
        >
          {byline ?? "by Peakbritt Financial Group"}
        </span>
      )}
    </span>
  );
}
