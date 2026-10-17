import { Link, useSearchParams } from "react-router-dom";
import {
  CakeSlice,
  Coffee,
  LayoutGrid,
  Salad,
  Soup,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { Banner } from "@/components/common/Banner";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { SectionHeader } from "@/components/common/SectionHeader";
import { BANNERS } from "@/lib/banners";
import { api } from "@/data/api";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import type { Recipe, RecipeCategory } from "@/data/types";

const CATEGORIES: {
  id: RecipeCategory | "all";
  label: string;
  icon: typeof UtensilsCrossed;
}[] = [
  { id: "all", label: "همه", icon: LayoutGrid },
  { id: "غذای اصلی", label: "غذای اصلی", icon: UtensilsCrossed },
  { id: "صبحانه", label: "صبحانه", icon: Coffee },
  { id: "سالاد", label: "سالاد", icon: Salad },
  { id: "دسر", label: "دسر", icon: CakeSlice },
  { id: "پیش‌غذا", label: "پیش‌غذا", icon: Soup },
  { id: "نوشیدنی", label: "نوشیدنی", icon: Wheat },
];

const TAG_FILTER: Record<string, (r: Recipe) => boolean> = {
  autumn: (r) =>
    ["آش رشته", "قورمه سبزی", "سوپ جو", "عدس پلو"].includes(r.title) ||
    r.tags.some((t) => t.includes("سنتی") || t.includes("خورشت")),
  desserts: (r) => r.category === "دسر",
  healthy: (r) =>
    r.category === "سالاد" || r.tags.some((t) => t.includes("رژیمی") || t.includes("سالم")),
  breakfast: (r) => r.category === "صبحانه",
};

export function CategoriesPage() {
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag") ?? "";
  const active = (params.get("cat") as RecipeCategory | "all") || "all";
  const { data: recipes = [] } = useAsync(() => api.listRecipes(), []);

  const filtered = recipes.filter((r) => {
    if (tag && TAG_FILTER[tag]) return TAG_FILTER[tag](r);
    if (active === "all") return true;
    return r.category === active;
  });

  const setCat = (id: string) => {
    const next = new URLSearchParams(params);
    next.delete("tag");
    if (id === "all") next.delete("cat");
    else next.set("cat", id);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">دسته‌بندی‌ها</h1>
        <p className="mt-2 text-sm text-muted">
          بر اساس نوع غذا، فصل و سبک زندگی انتخاب کن.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {BANNERS.categories.map((category) => (
          <Link
            key={category.id}
            to={`/categories?tag=${category.id}`}
            aria-label={category.title}
          >
            <Banner
              src={category.src}
              alt={category.title}
              ratio="auto"
              className={cn(
                "shadow-card transition-transform duration-300 hover:-translate-y-0.5",
                tag === category.id && "ring-2 ring-primary",
              )}
            />
          </Link>
        ))}
      </div>

      <ul className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              onClick={() => setCat(cat.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors",
                active === cat.id && !tag
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-line bg-surface text-muted hover:border-primary/40 hover:text-ink",
              )}
            >
              <cat.icon className="size-4 text-primary" />
              {cat.label}
            </button>
          </li>
        ))}
      </ul>

      <section>
        <SectionHeader
          title={
            tag
              ? BANNERS.categories.find((c) => c.id === tag)?.title ?? "نتایج"
              : active === "all"
                ? "همه دستور پخت‌ها"
                : active
          }
          subtitle={`${filtered.length} دستور`}
        />
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            در این دسته هنوز دستوری نیست.
          </p>
        ) : (
          <RecipeGrid recipes={filtered} />
        )}
      </section>
    </div>
  );
}
