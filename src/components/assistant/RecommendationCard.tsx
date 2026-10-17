import { Link } from "react-router-dom";
import { Check, Clock, Plus, Sparkles, X } from "lucide-react";
import { FoodImage } from "@/components/common/FoodImage";
import { Rating } from "@/components/common/Rating";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { formatMinutes, formatNumber } from "@/lib/format";
import type { Recommendation } from "@/data/types";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const { recipe, matchScore, matchedIngredients, missingIngredients, reason } =
    recommendation;
  const { addRecipe } = useShoppingList();
  const { toast } = useToast();

  const tone =
    matchScore >= 75 ? "high" : matchScore >= 50 ? "mid" : "low";

  return (
    <article className="card flex flex-col overflow-hidden sm:flex-row">
      <Link
        to={`/recipes/${recipe.id}`}
        className="relative sm:w-56 sm:shrink-0"
        aria-label={recipe.title}
      >
        <FoodImage
          seed={recipe.id}
          src={recipe.image}
          alt={recipe.title}
          ratio="aspect-[16/10] sm:h-full"
        />
        <span
          className={cn(
            "absolute right-3 top-3 grid size-14 place-items-center rounded-full text-center text-xs font-extrabold text-white shadow-pop",
            tone === "high" && "bg-primary",
            tone === "mid" && "bg-accent",
            tone === "low" && "bg-muted",
          )}
        >
          <span>
            {formatNumber(matchScore)}
            <span className="text-[10px] font-normal">٪</span>
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-ink sm:text-lg">
              <Link to={`/recipes/${recipe.id}`} className="hover:text-primary-dark">
                {recipe.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs leading-6 text-muted">{recipe.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <Rating value={recipe.rating} />
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatMinutes(recipe.timeMinutes)}
          </span>
          <Badge tone="primary">{recipe.category}</Badge>
        </div>

        <p className="flex items-start gap-1.5 text-xs leading-6 text-primary-dark">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
          {reason}
        </p>

        {matchedIngredients.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold text-ink">
              مواد موجود شما:
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {matchedIngredients.map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-bold text-primary-dark"
                >
                  <Check className="size-3" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingIngredients.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold text-ink">
              مواد لازم دیگر:
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {missingIngredients.slice(0, 5).map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11px] text-muted"
                >
                  <X className="size-3" />
                  {item}
                </li>
              ))}
              {missingIngredients.length > 5 && (
                <li className="inline-flex items-center rounded-full bg-canvas px-2.5 py-1 text-[11px] text-muted">
                  + {formatNumber(missingIngredients.length - 5)} مورد دیگر
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Link to={`/recipes/${recipe.id}`}>
            <Button size="sm">مشاهده دستور پخت</Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              addRecipe(recipe);
              toast("مواد لازم به لیست خرید اضافه شد");
            }}
          >
            <Plus className="size-4" />
            افزودن به لیست خرید
          </Button>
        </div>
      </div>
    </article>
  );
}
