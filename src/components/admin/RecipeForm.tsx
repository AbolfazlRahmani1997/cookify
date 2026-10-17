import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { api } from "@/data/api";
import type { Difficulty, Recipe, RecipeCategory } from "@/data/types";

const CATEGORIES: RecipeCategory[] = ["غذای اصلی", "پیش‌غذا", "دسر", "صبحانه", "سالاد", "نوشیدنی"];
const DIFFICULTIES: Difficulty[] = ["آسان", "متوسط", "سخت"];

type CatalogNode = { id: string; title: string; children?: { id: string; title: string }[] };
type Ing = { id: string; categoryId: string; name: string; amount: string; unit: string; group?: string };
type Step = { id: string; title: string; description: string; minutes: string };

const field =
  "w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-primary focus:outline-none";

function fromRecipe(recipe?: Recipe): {
  title: string;
  description: string;
  category: RecipeCategory;
  cuisine: string;
  difficulty: Difficulty;
  timeMinutes: string;
  prepMinutes: string;
  servings: string;
  calories: string;
  tags: string;
  ingredients: Ing[];
  steps: Step[];
  tips: string[];
} {
  return {
    title: recipe?.title ?? "",
    description: recipe?.description ?? "",
    category: recipe?.category ?? "غذای اصلی",
    cuisine: recipe?.cuisine ?? "ایرانی",
    difficulty: recipe?.difficulty ?? "متوسط",
    timeMinutes: String(recipe?.timeMinutes ?? 30),
    prepMinutes: String(recipe?.prepMinutes ?? 10),
    servings: String(recipe?.servings ?? 4),
    calories: String(recipe?.calories ?? ""),
    tags: recipe?.tags.join("، ") ?? "",
    ingredients: recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          id: i.id,
          categoryId: "",
          name: i.name,
          amount: String(i.amount),
          unit: i.unit,
          group: i.group ?? "",
        }))
      : [{ id: "", categoryId: "", name: "", amount: "", unit: "گرم", group: "" }],
    steps: recipe?.steps.length
      ? recipe.steps.map((s) => ({
          id: s.id,
          title: s.title ?? "",
          description: s.description,
          minutes: s.minutes ? String(s.minutes) : "",
        }))
      : [{ id: "", title: "", description: "", minutes: "" }],
    tips: recipe?.tips.length ? recipe.tips : [""],
  };
}

export function RecipeForm({
  recipe,
  onSaved,
  onCancel,
}: {
  recipe?: Recipe;
  onSaved: (recipe: Recipe) => void;
  onCancel: () => void;
}) {
  const initial = fromRecipe(recipe);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [cuisine, setCuisine] = useState(initial.cuisine);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [timeMinutes, setTimeMinutes] = useState(initial.timeMinutes);
  const [prepMinutes, setPrepMinutes] = useState(initial.prepMinutes);
  const [servings, setServings] = useState(initial.servings);
  const [calories, setCalories] = useState(initial.calories);
  const [tags, setTags] = useState(initial.tags);
  const [ingredients, setIngredients] = useState(initial.ingredients);
  const [catalog, setCatalog] = useState<CatalogNode[]>([]);
  const [namesByCategory, setNamesByCategory] = useState<Record<string, string[]>>({});
  const [steps, setSteps] = useState(initial.steps);
  const [tips, setTips] = useState(initial.tips);
  useEffect(() => {
    api
      .catalogCategories()
      .then((cats) => {
        setCatalog(cats);
        setIngredients((rows) =>
          rows.map((row) => {
            if (row.categoryId) return row;
            const parent =
              cats.find((cat) => cat.title === row.group) ??
              cats.find((cat) => cat.children?.some((child) => child.title === row.name));
            return { ...row, categoryId: parent?.id ?? "" };
          }),
        );
      })
      .catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    const missing = [...new Set(ingredients.map((row) => row.categoryId).filter((id) => id && !namesByCategory[id]))];
    if (missing.length === 0) return;
    missing.forEach((id) => {
      api
        .catalogIngredients(id)
        .then((names) => setNamesByCategory((prev) => ({ ...prev, [id]: names })))
        .catch(() => setNamesByCategory((prev) => ({ ...prev, [id]: [] })));
    });
  }, [ingredients, namesByCategory]);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ings = ingredients
      .map((row) => ({
        id: row.id,
        group: catalog.find((cat) => cat.id === row.categoryId)?.title ?? "",
        name: row.name.trim(),
        amount: Number(row.amount) || 0,
        unit: row.unit.trim() || "عدد",
      }))
      .filter((row) => row.name);
    const stepRows = steps
      .map((row, i) => ({
        id: row.id,
        order: i + 1,
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
    setBusy(true);
    setError(null);
    const body = {
      title: title.trim(),
      description: description.trim(),
      category,
      cuisine: cuisine.trim(),
      difficulty,
      timeMinutes: Number(timeMinutes) || 30,
      prepMinutes: Number(prepMinutes) || 0,
      servings: Number(servings) || 4,
      calories: Number(calories) || 0,
      tags: tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
      ingredients: ings,
      steps: stepRows,
      tips: tips.map((t) => t.trim()).filter(Boolean),
    };
    try {
      let saved = recipe
        ? await api.adminUpdateRecipe(recipe.id, body)
        : await api.adminCreateRecipe(body);
      if (file) saved = await api.uploadRecipeImage(saved.id, file);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره نشد");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-4">
      <h3 className="text-sm font-extrabold">{recipe ? "ویرایش دستور" : "دستور جدید"}</h3>
      <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان" required />
      <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیح" />
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value as RecipeCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className={field} value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="سبک آشپزی" />
        <select className={field} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
          {DIFFICULTIES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input className={field} type="number" min={1} value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} placeholder="زمان پخت" />
        <input className={field} type="number" min={0} value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} placeholder="آماده‌سازی" />
        <input className={field} type="number" min={1} value={servings} onChange={(e) => setServings(e.target.value)} placeholder="نفرات" />
        <input className={field} type="number" min={0} value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="کالری" />
      </div>
      <input className={field} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="برچسب‌ها، با ویرگول" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">مواد لازم</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIngredients((rows) => [...rows, { id: "", categoryId: "", name: "", amount: "", unit: "گرم", group: "" }])}>
            <Plus className="size-4" /> ماده
          </Button>
        </div>
        {ingredients.map((row, i) => {
          const loaded = namesByCategory[row.categoryId] ?? [];
          const names = !row.name || loaded.includes(row.name) ? loaded : [row.name, ...loaded];
          return (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_5rem_5rem_auto]">
            <select
              className={field}
              value={row.categoryId}
              onChange={(e) =>
                setIngredients((rows) =>
                  rows.map((r, idx) => (idx === i ? { ...r, categoryId: e.target.value, name: "" } : r)),
                )
              }
            >
              <option value="">دسته</option>
              {catalog.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
            <select
              className={field}
              value={row.name}
              onChange={(e) =>
                setIngredients((rows) => rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))
              }
            >
              <option value="">نام ماده</option>
              {names.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input className={field} value={row.amount} placeholder="مقدار" onChange={(e) => setIngredients((rows) => rows.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)))} />
            <input className={field} value={row.unit} placeholder="واحد" onChange={(e) => setIngredients((rows) => rows.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)))} />
            <button type="button" className="grid size-10 place-items-center text-muted hover:text-danger" aria-label="حذف ماده" onClick={() => setIngredients((rows) => rows.filter((_, idx) => idx !== i))}>
              <Trash2 className="size-4" />
            </button>
          </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">مراحل</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setSteps((rows) => [...rows, { id: "", title: "", description: "", minutes: "" }])}>
            <Plus className="size-4" /> مرحله
          </Button>
        </div>
        {steps.map((row, i) => (
          <div key={i} className="flex gap-2">
            <div className="grid flex-1 gap-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_6rem]">
                <input className={field} value={row.title} placeholder={`عنوان مرحله ${i + 1}`} onChange={(e) => setSteps((rows) => rows.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))} />
                <input className={field} value={row.minutes} placeholder="دقیقه" onChange={(e) => setSteps((rows) => rows.map((r, idx) => (idx === i ? { ...r, minutes: e.target.value } : r)))} />
              </div>
              <textarea className={field} rows={2} value={row.description} placeholder="شرح مرحله" onChange={(e) => setSteps((rows) => rows.map((r, idx) => (idx === i ? { ...r, description: e.target.value } : r)))} />
            </div>
            <button type="button" className="grid size-10 shrink-0 place-items-center text-muted hover:text-danger" aria-label="حذف مرحله" onClick={() => setSteps((rows) => rows.filter((_, idx) => idx !== i))}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">نکات</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setTips((rows) => [...rows, ""])}>
            <Plus className="size-4" /> نکته
          </Button>
        </div>
        {tips.map((tip, i) => (
          <div key={i} className="flex gap-2">
            <input className={field} value={tip} placeholder="نکته" onChange={(e) => setTips((rows) => rows.map((t, idx) => (idx === i ? e.target.value : t)))} />
            <button type="button" className="grid size-10 shrink-0 place-items-center text-muted hover:text-danger" aria-label="حذف نکته" onClick={() => setTips((rows) => rows.filter((_, idx) => idx !== i))}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-bold">تصویر</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {recipe?.image && !file && <span className="mt-1 block text-xs text-muted">تصویر فعلی حفظ می‌شود.</span>}
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>ذخیره</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>انصراف</Button>
      </div>
    </form>
  );
}
