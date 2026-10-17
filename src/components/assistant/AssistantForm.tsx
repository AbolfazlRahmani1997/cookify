import { useState } from "react";
import {
  Clock,
  Plus,
  Sparkles,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { SelectField } from "@/components/common/SelectField";
import { Chip } from "@/components/common/Chip";
import { cn } from "@/lib/cn";
import type { AssistantRequest } from "@/data/types";

const QUICK_INGREDIENTS = [
  "مرغ",
  "برنج",
  "تخم مرغ",
  "پاستا",
  "سیب‌زمینی",
  "پیاز",
  "گوجه",
  "شیر",
  "پنیر",
  "قارچ",
  "خامه",
  "کره",
  "آرد",
  "زعفران",
];

const MEAL_TYPES = ["غذای اصلی", "سریع", "سالاد", "دسر", "صبحانه", "رژیمی"];

const TIME_OPTIONS = [15, 30, 45, 60, 90];

export function AssistantForm({
  loading,
  onSubmit,
  initialIngredients = [],
}: {
  loading?: boolean;
  onSubmit: (request: AssistantRequest) => void;
  initialIngredients?: string[];
}) {
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [draft, setDraft] = useState("");
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [mealType, setMealType] = useState("غذای اصلی");
  const [servings, setServings] = useState(4);

  const addIngredient = (value: string) => {
    const v = value.trim();
    if (!v || ingredients.includes(v)) return;
    setIngredients((prev) => [...prev, v]);
  };

  const removeIngredient = (value: string) =>
    setIngredients((prev) => prev.filter((i) => i !== value));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ingredients, timeMinutes, mealType, servings });
  };

  return (
    <form onSubmit={submit} className="card space-y-6 p-5 sm:p-6">
      <div>
        <label
          htmlFor="ingredients"
          className="mb-2 flex items-center gap-2 text-sm font-extrabold text-ink"
        >
          <Utensils className="size-4 text-primary" />
          چه موادی در خانه دارید؟
        </label>
        <div className="flex gap-2">
          <input
            id="ingredients"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addIngredient(draft);
                setDraft("");
              }
            }}
            placeholder="مثلاً مرغ، برنج، گوجه…"
            className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-sm placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              addIngredient(draft);
              setDraft("");
            }}
            aria-label="افزودن ماده"
          >
            <Plus className="size-4" />
            افزودن
          </Button>
        </div>

        {ingredients.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {ingredients.map((item) => (
              <li key={item}>
                <span className="chip chip-active gap-1.5">
                  {item}
                  <button
                    type="button"
                    onClick={() => removeIngredient(item)}
                    aria-label={`حذف ${item}`}
                    className="rounded-full p-0.5 hover:bg-white/60"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3">
          <p className="mb-2 text-xs text-muted">پیشنهاد سریع:</p>
          <ul className="flex flex-wrap gap-2">
            {QUICK_INGREDIENTS.filter((i) => !ingredients.includes(i)).map(
              (item) => (
                <li key={item}>
                  <Chip
                    className="py-1 text-xs"
                    onClick={() => addIngredient(item)}
                  >
                    <Plus className="size-3" />
                    {item}
                  </Chip>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="چقدر زمان داری؟"
          name="time"
          icon={<Clock className="size-4" />}
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(Number(e.target.value))}
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              حدود {t} دقیقه
            </option>
          ))}
        </SelectField>

        <SelectField
          label="تعداد نفرات"
          name="servings"
          icon={<Users className="size-4" />}
          value={servings}
          onChange={(e) => setServings(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 6, 8].map((s) => (
            <option key={s} value={s}>
              {s} نفر
            </option>
          ))}
        </SelectField>
      </div>

      <div>
        <p className="mb-2 text-sm font-extrabold text-ink">نوع غذا</p>
        <ul className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((type) => (
            <li key={type}>
              <Chip
                active={mealType === type}
                onClick={() => setMealType(type)}
                className={cn("py-1.5")}
              >
                {type}
              </Chip>
            </li>
          ))}
        </ul>
      </div>

      <Button type="submit" size="lg" fullWidth loading={loading}>
        <Sparkles className="size-5" />
        پیشنهاد بده
      </Button>
    </form>
  );
}
