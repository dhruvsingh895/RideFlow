import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/format";
import { Input } from "./Input";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  icon,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Input
      icon={icon ?? <Search className="h-4 w-4" />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn(className)}
      rightSlot={
        value ? (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="rounded-md p-1 text-muted transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined
      }
    />
  );
}
