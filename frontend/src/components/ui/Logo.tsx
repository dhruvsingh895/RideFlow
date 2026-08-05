import { Car } from "lucide-react";

import { cn } from "../../lib/format";

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-glow">
        <Car className="h-5 w-5 text-white" />
      </span>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-ink">
          Ride<span className="text-brand">Flow</span>
        </span>
      )}
    </span>
  );
}
