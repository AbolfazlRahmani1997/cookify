import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChefHat,
  Clock,
  Lock,
  PartyPopper,
  Salad,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { FoodImage } from "@/components/common/FoodImage";
import { ListSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useMealPlan } from "@/context/MealPlanContext";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/data/api";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { formatMinutes, formatNumber, formatRating } from "@/lib/format";
import { pickWeekRecipes, type TonightAnswers } from "@/lib/mealPlan";
import type { Recommendation, Recipe } from "@/data/types";

const SERVING_OPTS = [
  { value: 2, label: "۲ نفر", hint: "دونفره" },
  { value: 4, label: "۴ نفر", hint: "خانواده" },
  { value: 6, label: "۶ نفر+", hint: "جمع بیشتر" },
];

const TIME_OPTS = [
  { value: 30, label: "۳۰ دقیقه", hint: "زود آماده‌ام" },
  { value: 45, label: "۴۵ دقیقه", hint: "معمولی" },
  { value: 90, label: "۹۰ دقیقه", hint: "با حوصله" },
];

const MOOD_OPTS = [
  {
    value: "خانگی",
    label: "خانگی و سیرکننده",
    hint: "برنج و خورش",
    icon: ChefHat,
    ingredients: ["برنج", "گوشت", "پیاز"],
  },
  {
    value: "سریع",
    label: "سریع و کم‌خرج",
    hint: "با مواد دم‌دست",
    icon: Wallet,
    ingredients: ["تخم مرغ", "سیب‌زمینی", "گوجه"],
  },
  {
    value: "سبک",
    label: "سبک و کم‌چرب",
    hint: "سالاد و مرغ",
    icon: Salad,
    ingredients: ["سبزی", "مرغ", "سالاد"],
  },
  {
    value: "مهمانی",
    label: "مجلسی",
    hint: "برای مهمان",
    icon: PartyPopper,
    ingredients: ["زرشک", "مرغ", "برنج"],
  },
] as const;

type Step = "servings" | "time" | "mood" | "results";
type MoodOpt = (typeof MOOD_OPTS)[number];

const STEP_META: Record<Exclude<Step, "results">, { n: number; title: string }> = {
  servings: { n: 1, title: "چند نفر؟" },
  time: { n: 2, title: "چقدر وقت؟" },
  mood: { n: 3, title: "چه حالی؟" },
};

export function TonightPage() {
  const { isLoggedIn } = useAuth();
  const { plan, setPending, saveTonight, saveTomorrow, saveWeek } = useMealPlan();
  const { addRecipe } = useShoppingList();
  const { toast } = useToast();
  const catalog = useAsync(() => api.listRecipes(), []);

  const [step, setStep] = useState<Step>("servings");
  const [servings, setServings] = useState(4);
  const [timeMinutes, setTimeMinutes] = useState(45);
  const [mood, setMood] = useState<MoodOpt>(MOOD_OPTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [authHint, setAuthHint] = useState<string | null>(null);

  const answers: TonightAnswers = {
    servings,
    timeMinutes,
    mood: mood.value,
    moodLabel: mood.label,
  };

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of catalog.data ?? []) map.set(r.id, r);
    for (const rec of results ?? []) map.set(rec.recipe.id, rec.recipe);
    return map;
  }, [catalog.data, results]);

  const filledDays = plan.days.filter((d) => d.dinnerRecipeId).length;

  const runSearch = async (nextMood: MoodOpt = mood, nextTime = timeMinutes, nextServings = servings) => {
    setLoading(true);
    setError(null);
    setAuthHint(null);
    setStep("results");
    setResults(null);
    try {
      const data = await api.recommend({
        ingredients: [...nextMood.ingredients],
        timeMinutes: nextTime,
        mealType: nextMood.value === "سبک" ? "سالاد" : "غذای اصلی",
        servings: nextServings,
      });
      const ranked = data
        .filter((r) => r.recipe.timeMinutes <= nextTime + 15)
        .slice(0, 3);
      const list = ranked.length ? ranked : data.slice(0, 3);
      setResults(list);
      setPickedId(list[0]?.recipe.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "پیشنهادها نیامد");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const requireAuth = (action: Parameters<typeof setPending>[0], ok: () => void) => {
    if (isLoggedIn) {
      setAuthHint(null);
      ok();
      return;
    }
    if (action) setPending(action);
    setAuthHint("برای ذخیره برنامه، وارد شو یا ثبت‌نام کن — همین‌جا می‌مانی.");
  };

  const onCookThis = (recipe: Recipe) => {
    addRecipe(recipe, servings);
    if (isLoggedIn) {
      saveTonight(recipe.id);
      setSavedFlash(true);
      toast("مواد به لیست خرید رفت و شام امشب ذخیره شد");
    } else {
      toast("مواد به لیست خرید اضافه شد");
    }
  };

  const onSaveTonight = (recipe: Recipe) => {
    requireAuth(
      { type: "save-tonight", recipeId: recipe.id, answers },
      () => {
        saveTonight(recipe.id);
        setSavedFlash(true);
        toast("شام امشب ذخیره شد");
      },
    );
  };

  const onRemindTomorrow = (recipe: Recipe) => {
    requireAuth(
      { type: "remind-tomorrow", recipeId: recipe.id, answers },
      () => {
        saveTomorrow(recipe.id);
        toast("برای فردا هم ثبت شد");
      },
    );
  };

  const onSaveWeek = (seed: Recipe) => {
    const week = pickWeekRecipes(seed, catalog.data ?? [], 7);
    const ids = week.map((r) => r.id);
    requireAuth(
      { type: "save-week", recipeId: seed.id, recipeIds: ids, answers },
      () => {
        saveWeek(ids);
        setSavedFlash(true);
        toast("برنامه ۷ روزه ذخیره شد");
      },
    );
  };

  const onShopWeek = () => {
    if (!isLoggedIn) {
      setAuthHint("برای خرید کل هفته اول وارد شو — پیشنهادها همین‌جا می‌مانند.");
      return;
    }
    const ids = plan.days.map((d) => d.dinnerRecipeId).filter(Boolean) as string[];
    if (!ids.length) {
      toast("هنوز برنامه‌ای ذخیره نشده");
      return;
    }
    const unique = [...new Set(ids)];
    for (const id of unique) {
      const recipe = recipeMap.get(id);
      if (recipe) addRecipe(recipe, servings);
    }
    toast(`${formatNumber(unique.length)} غذا به لیست خرید اضافه شد`);
  };

  const chooseServing = (value: number) => {
    setServings(value);
    window.setTimeout(() => setStep("time"), 180);
  };

  const chooseTime = (value: number) => {
    setTimeMinutes(value);
    window.setTimeout(() => setStep("mood"), 180);
  };

  const chooseMood = (opt: MoodOpt) => {
    setMood(opt);
    window.setTimeout(() => void runSearch(opt, timeMinutes, servings), 180);
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-extrabold text-primary-dark">
            <Zap className="size-3.5" />
            کمتر از ۳۰ ثانیه
          </span>
          {step !== "results" && (
            <span className="text-[11px] font-bold text-muted">
              سؤال {formatNumber(STEP_META[step].n)} از ۳
            </span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">
          {step === "results" ? "پیشنهاد شام امشب" : "امشب چه بپزم؟"}
        </h1>
        {step !== "results" ? (
          <p className="text-sm leading-7 text-muted">
            جواب بده، سه تا شام مناسب می‌آید. خرید همین الان؛ ذخیره برنامه با حساب.
          </p>
        ) : (
          <p className="text-sm leading-7 text-muted">
            برای {formatNumber(servings)} نفر · تا {formatMinutes(timeMinutes)} · {mood.label}
          </p>
        )}
      </header>

      {step !== "results" && (
        <ol className="flex gap-2" aria-label="پیشرفت">
          {(["servings", "time", "mood"] as const).map((s) => {
            const active = step === s;
            const done = STEP_META[s].n < STEP_META[step as Exclude<Step, "results">].n;
            return (
              <li key={s} className="flex-1 space-y-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    active || done ? "bg-primary" : "bg-line",
                  )}
                />
                <p
                  className={cn(
                    "text-[10px] font-bold",
                    active ? "text-primary-dark" : "text-muted",
                  )}
                >
                  {STEP_META[s].title}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {step === "servings" && (
        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Users className="size-5 text-primary" />
            چند نفر شام می‌خورید؟
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {SERVING_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => chooseServing(opt.value)}
                className={cn(
                  "rounded-2xl border px-2 py-4 text-center transition active:scale-[0.98]",
                  servings === opt.value
                    ? "border-primary bg-primary-light text-primary-dark"
                    : "border-line bg-surface text-ink hover:border-primary/40",
                )}
              >
                <span className="block text-lg font-extrabold">{opt.label}</span>
                <span className="mt-1 block text-[11px] font-medium text-muted">
                  {opt.hint}
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted">یکی را بزن؛ خودکار می‌رود سؤال بعد</p>
        </section>
      )}

      {step === "time" && (
        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Clock className="size-5 text-primary" />
            چقدر وقت داری؟
          </h2>
          <div className="grid gap-2">
            {TIME_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => chooseTime(opt.value)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-bold transition active:scale-[0.99]",
                  timeMinutes === opt.value
                    ? "border-primary bg-primary-light text-primary-dark"
                    : "border-line bg-surface text-ink hover:border-primary/40",
                )}
              >
                <span>{opt.label}</span>
                <span className="text-xs font-medium text-muted">{opt.hint}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-bold text-muted"
            onClick={() => setStep("servings")}
          >
            برگشت به تعداد نفرات
          </button>
        </section>
      )}

      {step === "mood" && (
        <section className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Sparkles className="size-5 text-primary" />
            حال و هوای امشب؟
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {MOOD_OPTS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => chooseMood(opt)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-right transition active:scale-[0.98]",
                    mood.value === opt.value
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-line bg-surface text-ink hover:border-primary/40",
                  )}
                >
                  <Icon className="size-5 text-primary" />
                  <span className="text-sm font-extrabold leading-6">{opt.label}</span>
                  <span className="text-[11px] font-medium text-muted">{opt.hint}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="text-xs font-bold text-muted"
            onClick={() => setStep("time")}
          >
            برگشت به زمان
          </button>
        </section>
      )}

      {loading && step === "results" && <ListSkeleton count={3} />}
      {error && <ErrorState description={error} onRetry={() => void runSearch()} />}

      {step === "results" && results && !loading && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {MOOD_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setMood(opt);
                  void runSearch(opt);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                  mood.value === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-muted hover:text-ink",
                )}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              className="ms-auto text-xs font-bold text-primary-dark"
              onClick={() => {
                setResults(null);
                setStep("servings");
              }}
            >
              از اول
            </button>
          </div>

          {results.length === 0 ? (
            <div className="card space-y-3 p-6 text-center">
              <p className="text-sm text-muted">با این فیلتر چیزی پیدا نشد.</p>
              <Button variant="secondary" onClick={() => setStep("time")}>
                زمان را بازتر کن
              </Button>
            </div>
          ) : (
            results.map((rec, index) => {
              const recipe = rec.recipe;
              const selected = pickedId === recipe.id;
              const top = index === 0;
              return (
                <article
                  key={recipe.id}
                  className={cn(
                    "card overflow-hidden border transition",
                    selected ? "border-primary ring-1 ring-primary/20" : "border-line/80",
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full gap-3 p-3 text-right sm:gap-4 sm:p-4"
                    onClick={() => setPickedId(recipe.id)}
                  >
                    <div className="relative shrink-0">
                      <FoodImage
                        seed={recipe.id}
                        src={recipe.image}
                        alt={recipe.title}
                        className="size-24 rounded-xl sm:size-28"
                        ratio="aspect-square"
                      />
                      {top && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold text-white">
                          برتر
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-extrabold text-ink">{recipe.title}</h3>
                        {selected && (
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-white">
                            <Check className="size-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs leading-6 text-muted">
                        {rec.reason || recipe.description}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-muted">
                        <span>{formatMinutes(recipe.timeMinutes)}</span>
                        <span>{formatNumber(recipe.servings)} نفر</span>
                        <span>★ {formatRating(recipe.rating)}</span>
                        {rec.matchScore > 0 && (
                          <span className="text-primary-dark">
                            تطبیق {formatNumber(rec.matchScore)}٪
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {selected && (
                    <div className="space-y-3 border-t border-line bg-canvas/50 p-3 sm:p-4">
                      <Button fullWidth size="lg" onClick={() => onCookThis(recipe)}>
                        <ShoppingCart className="size-4" />
                        همین رو می‌پزم — افزودن به خرید
                      </Button>
                      <div className="grid grid-cols-3 gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onSaveTonight(recipe)}>
                          {isLoggedIn ? "ذخیره امشب" : (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="size-3.5" /> امشب
                            </span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onRemindTomorrow(recipe)}
                        >
                          فردا
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => onSaveWeek(recipe)}>
                          <CalendarDays className="size-3.5" />
                          هفته
                        </Button>
                      </div>
                      {authHint && (
                        <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs leading-6 text-muted">
                          {authHint}{" "}
                          <Link
                            to={`/signup?next=${encodeURIComponent("/tonight")}`}
                            className="font-bold text-primary-dark"
                          >
                            ثبت‌نام
                          </Link>
                          {" · "}
                          <Link
                            to={`/login?next=${encodeURIComponent("/tonight")}`}
                            className="font-bold text-primary-dark"
                          >
                            ورود
                          </Link>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/recipes/${recipe.id}`}
                          className="text-xs font-bold text-primary-dark"
                        >
                          دیدن طرز تهیه
                        </Link>
                        <Link
                          to="/shopping-list"
                          className="text-xs font-bold text-muted"
                        >
                          رفتن به لیست خرید
                        </Link>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}

          {(filledDays > 0 || savedFlash) && (
            <section className="card space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-ink">
                  برنامه هفته
                  {filledDays > 0 && (
                    <span className="ms-2 text-xs font-bold text-muted">
                      {formatNumber(filledDays)} از ۷
                    </span>
                  )}
                </h2>
                <Button size="sm" variant="secondary" onClick={onShopWeek}>
                  خرید هفته
                </Button>
              </div>
              <ul className="divide-y divide-line">
                {plan.days.map((day) => {
                  const recipe = day.dinnerRecipeId
                    ? recipeMap.get(day.dinnerRecipeId)
                    : undefined;
                  return (
                    <li
                      key={day.dateKey}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span className="w-14 shrink-0 text-xs font-bold text-muted">
                        {day.label}
                      </span>
                      {recipe ? (
                        <Link
                          to={`/recipes/${recipe.id}`}
                          className="truncate text-sm font-extrabold text-ink hover:text-primary-dark"
                        >
                          {recipe.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </section>
      )}

      {step !== "results" && (
        <p className="text-center text-xs leading-6 text-muted">
          هنوز تصمیم نگرفتی؟ بعداً هم می‌توانی از منوی «امشب» برگردی.
        </p>
      )}
    </div>
  );
}
