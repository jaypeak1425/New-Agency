"use client";

import { useFormStatus } from "react-dom";
import { buttonClassName, type ButtonVariant } from "./ui/button-styles";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingText: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={buttonClassName(variant, className)}>
      {pending ? pendingText : children}
    </button>
  );
}
