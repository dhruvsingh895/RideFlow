import { ArrowRight, Car, Flag, MapPin } from "lucide-react";

import { cn, fmtDateTime, inr } from "../lib/format";
import type { Ride } from "../types";
import { StatusBadge } from "./StatusBadge";

export function RideCard({
  ride,
  onClick,
  showDriver = false,
}: {
  ride: Ride;
  onClick?: () => void;
  showDriver?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group w-full rounded-2xl border border-edge bg-surface p-4 text-left shadow-soft transition-all duration-200",
        onClick
          ? "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
          : "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                ride.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : ride.status === "cancelled"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-blue-500/10 text-blue-500"
              )}
            >
              <Car className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                Ride #{ride.id}
                {showDriver && ride.driver && (
                  <span className="ml-1.5 font-normal text-muted">
                    · {ride.driver.name}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">{fmtDateTime(ride.created_at)}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 pl-[52px]">
            <p className="flex items-center gap-2 text-sm text-ink">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{ride.pickup}</span>
            </p>
            <p className="flex items-center gap-2 text-sm text-ink">
              <Flag className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="truncate">{ride.destination}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <StatusBadge status={ride.status} />
          <div className="text-right">
            <p className="text-base font-bold tabular-nums text-ink">{inr(ride.fare)}</p>
            <p className="text-[11px] capitalize text-muted">{ride.payment_method}</p>
          </div>
          {onClick && (
            <ArrowRight className="h-4 w-4 text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
          )}
        </div>
      </div>
    </button>
  );
}
