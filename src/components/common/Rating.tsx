import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber, formatRating } from "@/lib/format";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const iconSize = size === "md" ? "size-4" : "size-3.5";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`امتیاز ${formatRating(value)} از ۵`}
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {stars.map((s) => (
          <Star
            key={s}
            className={cn(
              iconSize,
              s <= Math.round(value)
                ? "fill-accent text-accent"
                : "fill-line text-line",
            )}
          />
        ))}
      </span>
      <span
        className={cn(
          "font-bold text-ink",
          size === "md" ? "text-sm" : "text-xs",
        )}
      >
        {formatRating(value)}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-muted">({formatNumber(count)} نظر)</span>
      )}
    </div>
  );
}
