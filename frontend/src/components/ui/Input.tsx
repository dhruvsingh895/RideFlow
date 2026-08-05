import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/format";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightSlot?: ReactNode;
  invalid?: boolean;
  hint?: string;
}

export function Input({
  icon,
  rightSlot,
  invalid,
  hint,
  className,
  ...rest
}: InputProps) {
  return (
    <div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          className={cn(
            "input",
            icon && "pl-10",
            rightSlot && "pr-11",
            invalid &&
              "border-red-400 focus:border-red-400 focus:ring-red-500/20",
            className
          )}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{hint}</p>
      )}
    </div>
  );
}
