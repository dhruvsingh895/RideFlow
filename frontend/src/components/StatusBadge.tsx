import { Ban, Car, CircleCheck, Clock, Navigation } from "lucide-react";

import type { RideStatus } from "../types";
import { Badge } from "./ui/Badge";
import type { BadgeVariant } from "./ui/Badge";

const config: Record<RideStatus, { variant: BadgeVariant; label: string; icon: typeof Clock }> = {
  requested: { variant: "warning", label: "Finding driver", icon: Clock },
  accepted: { variant: "brand", label: "Driver assigned", icon: Car },
  started: { variant: "violet", label: "In progress", icon: Navigation },
  completed: { variant: "success", label: "Completed", icon: CircleCheck },
  cancelled: { variant: "danger", label: "Cancelled", icon: Ban },
};

export function StatusBadge({ status, className }: { status: RideStatus; className?: string }) {
  const c = config[status];
  return (
    <Badge variant={c.variant} icon={<c.icon className="h-3 w-3" />} className={className}>
      {c.label}
    </Badge>
  );
}
