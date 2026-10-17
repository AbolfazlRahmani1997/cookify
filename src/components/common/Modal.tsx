import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full max-w-lg animate-fade-in rounded-t-3xl bg-surface shadow-pop sm:rounded-3xl",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-extrabold text-ink">{title}</h2>
          <IconButton label="بستن" onClick={onClose} size="sm">
            <X className="size-5" />
          </IconButton>
        </header>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 scrollbar-thin">
          {children}
        </div>
        {footer && (
          <footer className="border-t border-line px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>
  );
}
