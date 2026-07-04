import type { ButtonHTMLAttributes } from "react";
import { buttonClassName, type ButtonVariant } from "./button-styles";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
