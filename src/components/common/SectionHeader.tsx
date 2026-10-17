import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionTo,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex items-end justify-between gap-4 sm:mb-6",
        className,
      )}
    >
      <div>
        <h2 className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {action ??
        (actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary-dark transition-colors hover:text-primary"
          >
            {actionLabel}
            <ArrowLeft className="size-4" />
          </Link>
        ))}
    </div>
  );
}
