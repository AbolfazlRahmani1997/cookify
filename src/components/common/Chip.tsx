import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn("chip hover:border-primary/40 hover:text-ink", active && "chip-active", className)}
      {...props}
    >
      {children}
    </button>
  );
}
