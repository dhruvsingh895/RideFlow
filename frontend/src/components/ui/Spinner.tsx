import { Loader2 } from "lucide-react";

import { cn } from "../../lib/format";
import { Logo } from "./Logo";

export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return <Loader2 className={cn("animate-spin text-brand", className)} />;
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg">
      <span className="animate-pulse">
        <Logo />
      </span>
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-brand" />
        Loading RideFlow…
      </div>
    </div>
  );
}
