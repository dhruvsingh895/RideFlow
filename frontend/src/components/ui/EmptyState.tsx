import type { ReactNode } from "react";

import { cn } from "../../lib/format";
import { Button } from "./Button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-surface/50 text-center",
        compact ? "px-4 py-10" : "px-6 py-16"
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
