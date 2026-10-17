import { Link } from "react-router-dom";
import { Clock, Plus, Users } from "lucide-react";
import { FoodImage } from "@/components/common/FoodImage";
import { Rating } from "@/components/common/Rating";
import { Badge } from "@/components/common/Badge";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { formatMinutes } from "@/lib/format";
import type { Recipe } from "@/data/types";

/**
 * Horizontal recipe card. Per the RTL rules the food image sits on the right.
 */
export function RecipeHorizontalCard({
  recipe,
  badge,
}: {
  recipe: Recipe;
  badge?: string;
}) {
  const { addRecipe } = useShoppingList();
  const { toast } = useToast();

  return (
    <article className="card group flex overflow-hidden hover:shadow-pop">
      <Link
        to={`/recipes/${recipe.id}`}
        className="relative w-32 shrink-0 sm:w-40"
        aria-label={recipe.title}
      >
        <FoodImage seed={recipe.id} src={recipe.image} alt={recipe.title} ratio="h-full" className="transition duration-500 group-hover:scale-[1.03]" />
        {badge && (
          <span className="absolute right-2 top-2">
            <Badge tone="accent">{badge}</Badge>
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3.5 sm:p-4">
        <h3 className="line-clamp-1 font-extrabold text-ink">
          <Link to={`/recipes/${recipe.id}`} className="hover:text-primary-dark">
            {recipe.title}
          </Link>
        </h3>
        <p className="line-clamp-1 text-xs text-muted">{recipe.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <Rating value={recipe.rating} />
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatMinutes(recipe.timeMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {recipe.servings} نفر
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            addRecipe(recipe);
            toast("مواد لازم به لیست خرید اضافه شد");
          }}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-xl bg-primary-light px-3 py-1.5 text-xs font-bold text-primary-dark transition-colors hover:bg-primary hover:text-white"
        >
          <Plus className="size-3.5" />
          افزودن به لیست خرید
        </button>
      </div>
    </article>
  );
}
