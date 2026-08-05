import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/format";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-soft hover:bg-brand-hover hover:shadow-card active:scale-[0.98]",
  secondary:
    "bg-surface text-ink border border-edge hover:bg-surface2 hover:shadow-soft active:scale-[0.98]",
  outline:
    "border border-edge text-ink hover:bg-surface2 hover:border-muted/40 active:scale-[0.98]",
  ghost: "text-muted hover:bg-surface2 hover:text-ink",
  danger: "bg-red-500 text-white shadow-soft hover:bg-red-600 hover:shadow-card active:scale-[0.98]",
  success:
    "bg-emerald-500 text-white shadow-soft hover:bg-emerald-600 hover:shadow-card active:scale-[0.98]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-10 w-10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "btn-focus inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
