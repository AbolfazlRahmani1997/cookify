import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  step = 1,
  className,
  label = "تعداد",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
  className?: string;
  label?: string;
}) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="کاهش"
        onClick={() => onChange(Math.max(min, round(value - step)))}
        className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ink">
        {formatNumber(round(value))}
      </span>
      <button
        type="button"
        aria-label="افزایش"
        onClick={() => onChange(round(value + step))}
        className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
