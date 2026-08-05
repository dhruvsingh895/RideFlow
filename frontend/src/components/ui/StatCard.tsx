import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/format";

export type StatAccent = "brand" | "emerald" | "amber" | "red" | "violet" | "slate";

const chip: Record<StatAccent, string> = {
  brand: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

function useCountUp(target: number, duration = 700): string {
  const [value, setValue] = useState(target);
  const raf = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef(target);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = 0;
    const step = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const progress = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value.toFixed(2);
}

export function StatCard({
  label,
  value,
  icon,
  sub,
  accent = "brand",
  prefix = "",
  className,
}: {
  label: string;
  value: number;
  icon?: ReactNode | LucideIcon;
  sub?: string;
  accent?: StatAccent;
  prefix?: string;
  className?: string;
}) {
  const animated = useCountUp(Number.isFinite(value) ? value : 0);
  const iconNode =
    typeof icon === "function" ? <icon className="h-5 w-5" /> : icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-edge bg-surface p-5 shadow-soft transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-card",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]",
          accent === "brand" && "bg-blue-500",
          accent === "emerald" && "bg-emerald-500",
          accent === "amber" && "bg-amber-500",
          accent === "red" && "bg-red-500",
          accent === "violet" && "bg-violet-500",
          accent === "slate" && "bg-slate-500"
        )}
      />
      <div className="flex items-start justify-between">
        {iconNode && (
          <div className={cn("grid h-11 w-11 place-items-center rounded-xl", chip[accent])}>
            {iconNode}
          </div>
        )}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-ink">
        {prefix}
        {animated}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
