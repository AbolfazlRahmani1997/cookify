import { Link } from "react-router-dom";
import { Clock, Heart, Plus, Star } from "lucide-react";
import { FoodImage } from "@/components/common/FoodImage";
import { useSaved } from "@/context/SavedContext";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { formatMinutes, formatNumber, formatRating } from "@/lib/format";
import type { Recipe } from "@/data/types";

export function RecipeCard({
  recipe,
  variant = "app",
}: {
  recipe: Recipe;
  variant?: "app" | "landing";
}) {
  const { isSaved, toggleSaved } = useSaved();
  const { addRecipe } = useShoppingList();
  const { toast } = useToast();
  const saved = isSaved(recipe.id);

  return (
    <article className="card group relative flex flex-col p-2 hover:shadow-pop">
      <div className="relative overflow-hidden rounded-xl">
        <Link to={`/recipes/${recipe.id}`} aria-label={recipe.title}>
          <FoodImage seed={recipe.id} src={recipe.image} alt={recipe.title} ratio="aspect-[4/3]" className="transition duration-500 group-hover:scale-[1.03]" />
        </Link>

        <button
          type="button"
          onClick={() => {
            toggleSaved(recipe.id);
            toast(
              saved ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد",
              saved ? "info" : "success",
            );
          }}
          aria-label={saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          aria-pressed={saved}
          className={cn(
            "absolute left-2 top-2 grid size-8 place-items-center rounded-full shadow-soft transition-colors",
            saved
              ? "bg-danger text-white"
              : "bg-white/90 text-muted hover:text-danger",
          )}
        >
          <Heart className={cn("size-4", saved && "fill-current")} />
        </button>

        <button
          type="button"
          onClick={() => {
            addRecipe(recipe);
            toast("مواد لازم به لیست خرید اضافه شد");
          }}
          aria-label={`افزودن مواد ${recipe.title} به لیست خرید`}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-primary text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Plus className="size-4" />
        </button>

        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-soft">
          <Clock className="size-3 text-primary" />
          {formatMinutes(recipe.timeMinutes)}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
        <h3 className="line-clamp-1 text-sm font-extrabold text-ink">
          <Link to={`/recipes/${recipe.id}`} className="hover:text-primary-dark">
            {recipe.title}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <Star className="size-3.5 fill-accent text-accent" />
          <span className="font-bold text-ink">{formatRating(recipe.rating)}</span>
          <span className="text-muted">({formatNumber(recipe.reviewsCount)})</span>
        </div>

        {variant === "app" ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            <li className="rounded-lg bg-primary-light px-2 py-1 text-[11px] font-bold text-primary-dark">
              {recipe.category}
            </li>
            <li className="rounded-lg bg-canvas px-2 py-1 text-[11px] text-muted">
              {recipe.cuisine}
            </li>
          </ul>
        ) : (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted">
            <Clock className="size-3.5 text-primary" />
            {formatMinutes(recipe.timeMinutes)}
            <span className="mx-1">•</span>
            <span>{recipe.difficulty}</span>
          </div>
        )}
      </div>
    </article>
  );
}
