import type { InputHTMLAttributes } from "react";

export function Input({
  label,
  name,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-medium text-charcoal">
      {label}
      <input
        name={name}
        className={[
          "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm",
          "text-charcoal placeholder:text-charcoal/40",
          "focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </label>
  );
}
