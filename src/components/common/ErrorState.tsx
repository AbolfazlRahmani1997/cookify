import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/cn";

export function ErrorState({
  title = "مشکلی پیش آمد",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-red-100 text-danger">
        <AlertTriangle className="size-8" />
      </div>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      )}
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-4" />
          تلاش دوباره
        </Button>
      )}
    </div>
  );
}
