import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { LOGO } from "@/lib/banners";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Cookify — صفحه اصلی"
    >
      <img
        src={LOGO.mark}
        alt=""
        className={cn(
          "w-auto shrink-0 object-contain transition-transform duration-200 group-hover:scale-105",
          compact ? "h-8" : "h-9",
        )}
      />
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-extrabold text-ink">Cookify</span>
        {!compact && (
          <span className="text-[11px] text-muted">
            آشپزی ساده‌تر، زندگی خوشمزه‌تر
          </span>
        )}
      </span>
    </Link>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-block", className)} aria-label="Cookify — صفحه اصلی">
      <img src={LOGO.full} alt="Cookify" className="w-full max-w-[200px]" />
    </Link>
  );
}
