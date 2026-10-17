import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "primary" | "accent" | "muted" | "danger" | "info";

const tones: Record<Tone, string> = {
  primary: "bg-primary-light text-primary-dark",
  accent: "bg-amber-50 text-amber-700",
  muted: "bg-canvas text-muted",
  danger: "bg-red-50 text-red-600",
  info: "bg-blue-50 text-blue-600",
};

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
