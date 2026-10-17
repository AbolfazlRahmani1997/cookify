import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  error?: string;
}

export function TextField({
  label,
  hint,
  icon,
  error,
  className,
  id,
  ...props
}: TextFieldProps) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-bold text-ink"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-muted/70",
            "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            icon && "pr-11",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
