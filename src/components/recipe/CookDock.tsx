import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing, Square } from "lucide-react";
import { useCookSession } from "@/context/CookSessionContext";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/common/Button";

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${formatNumber(minutes)}:${formatNumber(seconds).padStart(2, "۰")}`;
}

export function CookDock() {
  const { session, now, stop, openNtfySubscribe } = useCookSession();

  useEffect(() => {
    if (!session?.finished) return;
    const timer = window.setTimeout(() => void stop(), 5000);
    return () => window.clearTimeout(timer);
  }, [session?.finished, stop]);

  if (!session || session.finished) return null;

  const untilNext = session.nextNudgeAt - now;
  const untilDone = session.totalMinutes * 60_000 - (now - session.startedAt);

  return (
    <div className="fixed inset-x-0 bottom-[4.5rem] z-40 px-3 lg:bottom-4">
      <div className="card mx-auto flex max-w-lg items-center gap-3 border border-primary/30 p-3 shadow-soft">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{session.label}</p>
          <p className="truncate text-xs text-muted">
            چک بعدی {formatClock(untilNext)} · پایان حدود {formatClock(untilDone)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <Link
              to={`/recipes/${session.recipeId}`}
              className="text-xs font-bold text-primary-dark"
            >
              بازگشت به دستور
            </Link>
            <button
              type="button"
              onClick={openNtfySubscribe}
              className="text-xs font-bold text-primary-dark"
            >
              وصل کردن گوشی (ntfy)
            </button>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={openNtfySubscribe} aria-label="اشتراک ntfy">
          <Bell className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void stop()}
          aria-label="پایان همراه آشپزی"
        >
          <Square className="size-4" />
        </Button>
      </div>
    </div>
  );
}
