import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "outline-on-dark";

const base =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gold text-navy hover:bg-gold-light",
  secondary: "bg-navy text-cream hover:bg-navy-light",
  outline: "border border-navy text-navy hover:bg-navy hover:text-cream",
  "outline-on-dark": "border border-cream text-cream hover:bg-cream hover:text-navy",
};

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return cn(base, variants[variant], className);
}
