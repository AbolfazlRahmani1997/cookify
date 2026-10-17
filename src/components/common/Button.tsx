import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-soft disabled:bg-primary/50",
  secondary:
    "border border-primary/40 text-primary-dark bg-surface hover:bg-primary-light",
  ghost: "text-muted hover:bg-canvas hover:text-ink",
  accent: "bg-accent text-white hover:brightness-95 shadow-soft",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all duration-200 select-none",
        "disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
