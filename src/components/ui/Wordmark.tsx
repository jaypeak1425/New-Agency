import { cn } from "@/lib/cn";

export function Wordmark({
  withByline = false,
  variant = "light",
}: {
  withByline?: boolean;
  variant?: "light" | "dark";
}) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span
        className={cn(
          "font-serif text-xl font-semibold",
          variant === "light" ? "text-navy" : "text-cream",
        )}
      >
        Case <span className="text-gold">Atlas</span>
      </span>
      {withByline && (
        <span
          className={cn(
            "text-xs tracking-wide",
            variant === "light" ? "text-charcoal/60" : "text-cream/60",
          )}
        >
          by Peakbritt Financial Group
        </span>
      )}
    </span>
  );
}
