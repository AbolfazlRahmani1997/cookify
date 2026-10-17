import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
}

export function SelectField({
  label,
  icon,
  className,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
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
        <select
          id={selectId}
          className={cn(
            "h-12 w-full appearance-none rounded-xl border border-line bg-surface px-4 text-sm text-ink",
            "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            icon && "pr-11",
            "pl-9",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
      </div>
    </div>
  );
}
