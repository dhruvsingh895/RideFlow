import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  action,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand sm:grid">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {(actions ?? action) && (
        <div className="flex items-center gap-2.5">{actions ?? action}</div>
      )}
    </div>
  );
}
