import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-5 animate-spin text-primary", className)}
      aria-hidden
    />
  );
}

export function LoadingBlock({ label = "در حال بارگذاری…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-sm text-muted"
    >
      <Spinner />
      {label}
    </div>
  );
}
