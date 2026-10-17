import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChefHat,
  Clock,
  Heart,
  Pencil,
  Sparkles,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { AssistantForm } from "@/components/assistant/AssistantForm";
import { RecommendationCard } from "@/components/assistant/RecommendationCard";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { RecipeCarousel } from "@/components/recipe/RecipeCarousel";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ListSkeleton, GridSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { Banner } from "@/components/common/Banner";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { BANNERS } from "@/lib/banners";
import { foodIcon, foodTone } from "@/lib/foodIcons";
import { cn } from "@/lib/cn";
import { canPublishRecipes } from "@/lib/access";
import { useAuth } from "@/context/AuthContext";
import type { AssistantRequest, Recommendation } from "@/data/types";

const HOME_INGREDIENTS = ["تخم مرغ", "شیر", "گوجه", "پیاز", "سیب‌زمینی", "برنج"];

const FILTER_CHIPS = [
  { icon: Heart, label: "سلیقه و رژیم", focus: "meal" },
  { icon: Utensils, label: "نوع غذا", focus: "meal" },
  { icon: Users, label: "تعداد نفرات", focus: "servings" },
  { icon: Clock, label: "مدت زمان", focus: "time" },
  { icon: Zap, label: "سریع بپزیم", focus: "quick" },
];

function parseSearchQuery(raw: string): string[] {
  return raw
    .split(/[،,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AssistantPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const publisher = canPublishRecipes(user);
  const q = (params.get("q") ?? "").trim();
  const initial = parseSearchQuery(q);

  const [showForm, setShowForm] = useState(initial.length > 0);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<AssistantRequest | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const popular = useAsync(() => api.getPopularRecipes(6), []);
  const catalog = useAsync(() => api.listRecipes(), []);

  const byHomeIngredients = useMemo(
    () =>
      (catalog.data ?? [])
        .filter((r) =>
          r.ingredients.some((ing) =>
            HOME_INGREDIENTS.some((h) => ing.name.includes(h)),
          ),
        )
        .slice(0, 4),
    [catalog.data],
  );

  const topRated = useMemo(
    () => [...(catalog.data ?? [])].sort((a, b) => b.rating - a.rating).slice(0, 4),
    [catalog.data],
  );

  const run = async (request: AssistantRequest) => {
    setLastRequest(request);
    setLoading(true);
    setError(null);
    try {
      const data = await api.recommend(request);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError(null);
    setLastRequest(null);
  };

  useEffect(() => {
    if (!q) return;
    const tokens = parseSearchQuery(q);
    if (!tokens.length) return;
    setShowForm(true);
    void run({
      ingredients: tokens,
      timeMinutes: 90,
      mealType: "",
      servings: 4,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openForm = (chip?: string) => {
    setActiveChip(chip ?? null);
    setShowForm(true);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#F3FAF5]">
        <img
          src={BANNERS.assistant}
          alt=""
          className="min-h-[220px] w-full object-cover object-left sm:min-h-[260px]"
        />
        <div className="absolute inset-y-0 right-0 flex w-[min(100%,30rem)] flex-col justify-center bg-gradient-to-l from-[#F3FAF5] from-70% via-[#F3FAF5] to-transparent px-6 sm:px-8">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            چه غذایی درست کنم؟
          </h1>
          <p className="mt-2 max-w-md text-sm leading-7 text-muted">
            مواد موجود، سلیقه‌ات و زمانت رو به من بگو تا بهترین پیشنهادها رو
            برات آماده کنم!
          </p>
          <Button size="lg" className="mt-5 self-start" onClick={() => openForm()}>
            <Sparkles className="size-5" />
            پیشنهاد بده
          </Button>
        </div>
      </section>

      <section aria-label="فیلترها">
        <ul className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <li key={chip.label}>
              <button
                type="button"
                onClick={() => openForm(chip.focus)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border bg-surface px-4 py-2.5 text-xs font-bold transition-colors",
                  activeChip === chip.focus
                    ? "border-primary bg-primary-light text-primary-dark"
                    : "border-line text-muted hover:border-primary/40 hover:text-ink",
                )}
              >
                <chip.icon className="size-4 text-primary" />
                {chip.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {showForm && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">
              {results ? "پیشنهادهای شما" : "بگو چی داری و چی می‌خوای"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setActiveChip(null);
                reset();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
            >
              <X className="size-4" />
              بستن
            </button>
          </div>

          <AssistantForm
            key={`${q}:${activeChip ?? ""}`}
            loading={loading}
            onSubmit={run}
            initialIngredients={
              activeChip === "quick"
                ? ["تخم مرغ", "گوجه"]
                : initial
            }
          />

          {loading && <ListSkeleton count={3} />}

          {!loading && error && (
            <ErrorState
              description={error}
              onRetry={() => lastRequest && run(lastRequest)}
            />
          )}

          {!loading && !error && results && (
            <div className="space-y-4">
              {lastRequest && (
                <p className="text-xs text-muted">
                  {q
                    ? `پیشنهاد بر اساس جستجوی «${q}»`
                    : `بر اساس ${lastRequest.ingredients.length} ماده، ${lastRequest.timeMinutes} دقیقه و ${lastRequest.servings} نفر`}
                </p>
              )}
              {results.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="size-7" />}
                  title="پیشنهادی پیدا نشد"
                  description="مواد بیشتری اضافه کن یا زمان را افزایش بده."
                />
              ) : (
                <ul className="space-y-4">
                  {results.map((rec) => (
                    <li key={rec.recipe.id}>
                      <RecommendationCard recommendation={rec} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="today-heading">
        <SectionHeader
          title="پیشنهادهای امروز برای شما"
          actionLabel="مشاهده همه"
          actionTo="/categories"
        />
        <h2 id="today-heading" className="sr-only">
          پیشنهادهای امروز برای شما
        </h2>
        {popular.loading ? (
          <GridSkeleton count={4} />
        ) : popular.error ? (
          <ErrorState description={popular.error} onRetry={popular.reload} />
        ) : (
          <RecipeCarousel recipes={popular.data ?? []} />
        )}
      </section>

      <section aria-labelledby="home-heading">
        <SectionHeader
          title="بر اساس مواد موجود در خانه شما"
          action={
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-dark hover:text-primary"
            >
              <Pencil className="size-4" />
              ویرایش
            </button>
          }
        />
        <h2 id="home-heading" className="sr-only">
          بر اساس مواد موجود در خانه شما
        </h2>

        <ul className="mb-4 flex flex-wrap gap-3">
          {HOME_INGREDIENTS.map((name) => {
            const Icon = foodIcon(name);
            return (
              <li key={name} className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid size-14 place-items-center rounded-full ${foodTone(name)}`}
                >
                  <Icon className="size-6" strokeWidth={1.8} />
                </span>
                <span className="text-[11px] text-muted">{name}</span>
              </li>
            );
          })}
        </ul>

        <RecipeGrid recipes={byHomeIngredients} />
      </section>

      <section aria-labelledby="top-heading">
        <SectionHeader
          title="دستورهای محبوب کاربران"
          actionLabel="مشاهده همه"
          actionTo="/community"
        />
        <h2 id="top-heading" className="sr-only">
          دستورهای محبوب کاربران
        </h2>
        <RecipeGrid recipes={topRated} />
      </section>

      <section aria-label="بنر دستیار">
        <Banner
          src={BANNERS.assistant}
          alt="پیشنهاد هوشمند Cookify"
          className="shadow-card"
        />
      </section>

      <section className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-6 text-center sm:flex-row sm:text-right">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-light text-primary-dark">
            <ChefHat className="size-6" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-ink">
              {publisher
                ? "دستور پخت مورد علاقه‌ات را پیدا نکردی؟"
                : "دستور غذا را چه کسی ثبت می‌کند؟"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {publisher
                ? "به‌عنوان سرآشپز می‌توانی دستور جدید به کاتالوگ اضافه کنی."
                : "فقط Cookify (از بک‌آفیس) و کاربران سطح سرآشپز دستور غذا می‌گذارند. تو می‌توانی دست‌پخت خودت را روی همین دستورها ثبت کنی."}
            </p>
          </div>
        </div>
        <Link to={publisher ? "/recipes/new" : "/community/create"} className="shrink-0">
          <Button variant="secondary">
            {publisher ? "ثبت دستور غذا" : "ثبت دست‌پخت"}
          </Button>
        </Link>
      </section>
    </div>
  );
}
