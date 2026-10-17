import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";

const config = {
  success: { icon: CheckCircle2, cls: "border-primary/30 bg-primary-light text-primary-dark" },
  error: { icon: XCircle, cls: "border-red-200 bg-red-50 text-red-700" },
  info: { icon: Info, cls: "border-blue-200 bg-blue-50 text-blue-700" },
} as const;

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      role="region"
      aria-live="polite"
      aria-label="پیام‌ها"
    >
      {toasts.map((t) => {
        const { icon: Icon, cls } = config[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-pop animate-fade-in",
              cls,
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm font-bold">{t.message}</p>
            <button
              type="button"
              aria-label="بستن پیام"
              onClick={() => dismiss(t.id)}
              className="rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
