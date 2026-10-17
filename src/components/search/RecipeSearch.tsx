import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { FoodImage } from "@/components/common/FoodImage";
import { Button } from "@/components/common/Button";
import { api } from "@/data/api";
import { cn } from "@/lib/cn";
import { formatMinutes, formatRating } from "@/lib/format";
import type { Recipe } from "@/data/types";

export function RecipeSearch({
  placeholder = "دنبال چه غذایی هستی؟",
  className,
  inputClassName,
  submitLabel,
  size = "md",
}: {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  submitLabel?: string;
  size?: "md" | "lg";
}) {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      api
        .listRecipes({ q, limit: 6 })
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goRecommend = (value: string) => {
    const q = value.trim();
    setOpen(false);
    navigate(q ? `/assistant?q=${encodeURIComponent(q)}` : "/assistant");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    goRecommend(query);
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <form
      ref={rootRef}
      onSubmit={submit}
      role="search"
      className={cn("relative", className)}
    >
      <Search
        className={cn(
          "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        aria-label="جستجوی دستور پخت"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={listId}
        autoComplete="off"
        className={cn(
          "w-full rounded-xl border border-line bg-canvas text-sm placeholder:text-muted/70 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20",
          size === "lg" ? "h-12 pr-12 pl-4" : "h-11 pr-11 pl-4",
          submitLabel && "pl-24",
          inputClassName,
        )}
      />
      {submitLabel && (
        <Button type="submit" size="sm" className="absolute left-1.5 top-1/2 -translate-y-1/2">
          {submitLabel}
        </Button>
      )}

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        >
          <button
            type="button"
            onClick={() => goRecommend(query)}
            className="flex w-full items-center gap-2 border-b border-line px-3.5 py-2.5 text-right text-sm font-bold text-primary-dark hover:bg-canvas"
          >
            <Sparkles className="size-4" />
            پیشنهاد غذا برای «{query.trim()}»
          </button>
          {loading && hits.length === 0 ? (
            <p className="px-3.5 py-3 text-xs text-muted">در حال پیدا کردن پیشنهاد…</p>
          ) : hits.length === 0 ? (
            <p className="px-3.5 py-3 text-xs text-muted">
              دستوری پیدا نشد. Enter بزن تا پیشنهاد نزدیک بسازیم.
            </p>
          ) : (
            <ul>
              {hits.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-3 px-3 py-2 text-right hover:bg-canvas"
                    onClick={() => {
                      setOpen(false);
                      navigate(`/recipes/${recipe.id}`);
                    }}
                  >
                    <span className="size-11 shrink-0 overflow-hidden rounded-xl">
                      <FoodImage
                        seed={recipe.id}
                        src={recipe.image}
                        alt=""
                        ratio="h-full"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">
                        {recipe.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {formatRating(recipe.rating)} • {formatMinutes(recipe.timeMinutes)} •{" "}
                        {recipe.category}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
