import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { SelectField } from "@/components/common/SelectField";
import { EmptyState } from "@/components/common/EmptyState";
import { api } from "@/data/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { canPublishRecipes } from "@/lib/access";
import type { Difficulty, RecipeCategory } from "@/data/types";

const CATEGORIES: RecipeCategory[] = [
  "غذای اصلی",
  "پیش‌غذا",
  "دسر",
  "صبحانه",
  "سالاد",
  "نوشیدنی",
];

const DIFFICULTIES: Difficulty[] = ["آسان", "متوسط", "سخت"];

type CatalogNode = { id: string; title: string; children?: { id: string; title: string }[] };
type IngRow = { categoryId: string; name: string; amount: string; unit: string };
type StepRow = { title: string; description: string; minutes: string };

export function CreateRecipePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const allowed = isLoggedIn && canPublishRecipes(user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RecipeCategory>("غذای اصلی");
  const [cuisine, setCuisine] = useState("ایرانی");
  const [difficulty, setDifficulty] = useState<Difficulty>("متوسط");
  const [timeMinutes, setTimeMinutes] = useState("30");
  const [prepMinutes, setPrepMinutes] = useState("10");
  const [servings, setServings] = useState("4");
  const [calories, setCalories] = useState("");
  const [tags, setTags] = useState("");
  const [tips, setTips] = useState("");
  const [categories, setCategories] = useState<CatalogNode[]>([]);
  const [ingredients, setIngredients] = useState<IngRow[]>([
    { categoryId: "", name: "", amount: "", unit: "گرم" },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([{ title: "", description: "", minutes: "" }]);

  useEffect(() => {
    if (!allowed) return;
    api.catalogCategories().then(setCategories).catch(() => setCategories([]));
  }, [allowed]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!allowed) {
    return (
      <EmptyState
        icon={<ChefHat className="size-7" />}
        title="ثبت دستور فقط برای سرآشپزهاست"
        description="دستورهای رسمی را Cookify از بک‌آفیس منتشر می‌کند. کاربران وقتی به سطح سرآشپز برسند می‌توانند دستور غذا ثبت کنند. تا آن زمان دست‌پخت خودت را روی دستورهای موجود به اشتراک بگذار."
        action={
          <Link to="/community/create">
            <Button>ثبت دست‌پخت</Button>
          </Link>
        }
      />
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ings = ingredients
      .map((row) => ({
        name: row.name.trim(),
        amount: Number(row.amount) || 0,
        unit: row.unit.trim() || "عدد",
        group: categories.find((cat) => cat.id === row.categoryId)?.title || "",
      }))
      .filter((row) => row.name);
    const stepRows = steps
      .map((row) => ({
        title: row.title.trim(),
        description: row.description.trim(),
        minutes: Number(row.minutes) || undefined,
      }))
      .filter((row) => row.description);
    if (!title.trim()) {
      setError("عنوان دستور را بنویس.");
      return;
    }
    if (ings.length === 0 || stepRows.length === 0) {
      setError("حداقل یک ماده و یک مرحله لازم است.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let recipe = await api.createRecipe({
        title: title.trim(),
        description: description.trim(),
        category,
        cuisine: cuisine.trim(),
        difficulty,
        timeMinutes: Number(timeMinutes) || 30,
        prepMinutes: Number(prepMinutes) || 0,
        servings: Number(servings) || 4,
        calories: Number(calories) || 0,
        tags: tags
          .split(/[،,]/)
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ings,
        steps: stepRows,
        tips: tips
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if (file) {
        recipe = await api.uploadRecipeImage(recipe.id, file);
      }
      toast("دستور غذا ثبت شد");
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-bold text-primary-dark">
          <ChefHat className="size-4" />
          سطح سرآشپز
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">ثبت دستور غذا</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          این فرم مخصوص سرآشپزهای پلتفرم است. بک‌آفیس Cookify هنوز آماده نیست؛
          دستورهای رسمی تیم هم از همانجا می‌آیند.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <div className="card space-y-4 p-5 sm:p-6">
          <TextField
            label="عنوان"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label htmlFor="desc" className="mb-2 block text-sm font-bold text-ink">
              توضیح
            </label>
            <textarea
              id="desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-7 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="دسته"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as RecipeCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
            <TextField
              label="سبک"
              name="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
            <SelectField
              label="سختی"
              name="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TextField
              label="زمان پخت (دقیقه)"
              name="time"
              type="number"
              min={1}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value)}
            />
            <TextField
              label="آماده‌سازی"
              name="prep"
              type="number"
              min={0}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
            />
            <TextField
              label="نفرات"
              name="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
            <TextField
              label="کالری"
              name="calories"
              type="number"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <TextField
            label="برچسب‌ها"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            hint="با کاما جدا کن"
            placeholder="مثلاً سنتی، سریع"
          />
        </div>

        <div className="card space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">مواد لازم</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setIngredients((rows) => [
                  ...rows,
                  { categoryId: "", name: "", amount: "", unit: "گرم" },
                ])
              }
            >
              <Plus className="size-4" />
              ماده
            </Button>
          </div>
          <ul className="space-y-2">
            {ingredients.map((row, i) => (
              <li key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_5.5rem_5.5rem_auto]">
                <SelectField
                  label={i === 0 ? "دسته" : undefined}
                  name={`ing-cat-${i}`}
                  value={row.categoryId}
                  onChange={(e) =>
                    setIngredients((rows) =>
                      rows.map((r, idx) =>
                        idx === i ? { ...r, categoryId: e.target.value, name: "" } : r,
                      ),
                    )
                  }
                >
                  <option value="">انتخاب دسته</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label={i === 0 ? "ماده" : undefined}
                  name={`ing-name-${i}`}
                  value={row.name}
                  onChange={(e) =>
                    setIngredients((rows) =>
                      rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                    )
                  }
                >
                  <option value="">انتخاب از دسته</option>
                  {(categories.find((cat) => cat.id === row.categoryId)?.children ?? []).map(
                    (child) => (
                      <option key={child.id} value={child.title}>
                        {child.title}
                      </option>
                    ),
                  )}
                </SelectField>
                <TextField
                  name={`ing-amt-${i}`}
                  type="number"
                  placeholder="مقدار"
                  value={row.amount}
                  onChange={(e) =>
                    setIngredients((rows) =>
                      rows.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)),
                    )
                  }
                />
                <TextField
                  name={`ing-unit-${i}`}
                  placeholder="واحد"
                  value={row.unit}
                  onChange={(e) =>
                    setIngredients((rows) =>
                      rows.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)),
                    )
                  }
                />
                <button
                  type="button"
                  className="grid size-12 place-items-center rounded-xl text-muted hover:bg-canvas hover:text-danger"
                  aria-label="حذف ماده"
                  onClick={() =>
                    setIngredients((rows) => rows.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">مراحل</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setSteps((rows) => [...rows, { title: "", description: "", minutes: "" }])
              }
            >
              <Plus className="size-4" />
              مرحله
            </Button>
          </div>
          <ul className="space-y-2">
            {steps.map((row, i) => (
              <li key={i} className="flex gap-2">
                <div className="grid flex-1 gap-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
                    <TextField
                      name={`step-title-${i}`}
                      placeholder={`عنوان مرحله ${i + 1}`}
                      value={row.title}
                      onChange={(e) =>
                        setSteps((rows) =>
                          rows.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)),
                        )
                      }
                    />
                    <TextField
                      name={`step-min-${i}`}
                      type="number"
                      min={0}
                      placeholder="دقیقه"
                      value={row.minutes}
                      onChange={(e) =>
                        setSteps((rows) =>
                          rows.map((r, idx) =>
                            idx === i ? { ...r, minutes: e.target.value } : r,
                          ),
                        )
                      }
                    />
                  </div>
                  <textarea
                    value={row.description}
                    onChange={(e) =>
                      setSteps((rows) =>
                        rows.map((r, idx) =>
                          idx === i ? { ...r, description: e.target.value } : r,
                        ),
                      )
                    }
                    rows={3}
                    placeholder="شرح دقیق این مرحله"
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-7 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  className="grid size-12 shrink-0 place-items-center rounded-xl text-muted hover:bg-canvas hover:text-danger"
                  aria-label="حذف مرحله"
                  onClick={() => setSteps((rows) => rows.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div>
            <label htmlFor="tips" className="mb-2 block text-sm font-bold text-ink">
              نکات (هر خط یک نکته)
            </label>
            <textarea
              id="tips"
              rows={3}
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-7 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed p-6 text-center hover:border-primary/40">
          <Upload className="size-6 text-primary-dark" />
          <span className="text-sm font-bold text-ink">
            {file ? file.name : "تصویر غذا (اختیاری)"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-bold text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            انتشار دستور
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            انصراف
          </Button>
        </div>
      </form>
    </div>
  );
}
