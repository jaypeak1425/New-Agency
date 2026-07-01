import { cn } from "@/lib/cn";

export type CardVariant = "light" | "dark";

const variants: Record<CardVariant, string> = {
  light: "border border-border bg-surface",
  dark: "bg-navy text-cream",
};

export function Card({
  children,
  variant = "light",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg p-8 shadow-sm", variants[variant], className)}>{children}</div>
  );
}
