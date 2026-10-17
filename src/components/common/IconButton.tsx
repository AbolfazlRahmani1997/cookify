import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: "plain" | "soft" | "outline";
  size?: "sm" | "md";
}

export function IconButton({
  label,
  children,
  className,
  variant = "plain",
  size = "md",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        size === "sm" ? "size-8" : "size-10",
        variant === "plain" && "text-muted hover:bg-canvas hover:text-ink",
        variant === "soft" && "bg-canvas text-ink hover:bg-line/60",
        variant === "outline" && "border border-line bg-surface hover:bg-canvas",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
