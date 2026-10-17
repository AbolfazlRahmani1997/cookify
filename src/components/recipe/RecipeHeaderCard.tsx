import {
  Bookmark,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Share2,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FoodImage } from "@/components/common/FoodImage";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { IconButton } from "@/components/common/IconButton";
import { useSaved } from "@/context/SavedContext";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { formatMinutes, formatNumber, formatRating } from "@/lib/format";
import type { Recipe } from "@/data/types";

export function RecipeHeaderCard({
  recipe,
  servings,
  onServingsChange,
}: {
  recipe: Recipe;
  servings: number;
  onServingsChange: (value: number) => void;
}) {
  const { isSaved, toggleSaved } = useSaved();
  const { addRecipe } = useShoppingList();
  const { toast } = useToast();
  const saved = isSaved(recipe.id);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("لینک دستور پخت کپی شد");
    } catch {
      toast("اشتراک‌گذاری انجام نشد", "error");
    }
  };

  return (
    <section className="card p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info (right in RTL) */}
        <div className="flex flex-col gap-4">
          <nav aria-label="مسیر صفحه" className="text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <span className="hover:text-primary-dark">دستور پخت‌ها</span>
              </li>
              <li aria-hidden>›</li>
              <li>
                <span className="hover:text-primary-dark">{recipe.cuisine}</span>
              </li>
              <li aria-hidden>›</li>
              <li className="font-bold text-ink">{recipe.title}</li>
            </ol>
          </nav>

          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              {recipe.title}
            </h1>
            <p className="mt-1 text-xs text-muted">
              {recipe.authorUsername ? (
                <>
                  ثبت‌شده توسط سرآشپز{" "}
                  <Link
                    to={`/profile/${recipe.authorUsername}`}
                    className="font-bold text-primary-dark hover:underline"
                  >
                    {recipe.authorName || recipe.authorUsername}
                  </Link>
                </>
              ) : (
                "دستور رسمی Cookify"
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              {recipe.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Flame className="size-4 text-primary" />
              {recipe.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-primary" />
              {formatMinutes(recipe.timeMinutes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              {formatNumber(recipe.servings)} نفر
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-accent text-accent" />
              <span className="font-bold text-ink">
                {formatRating(recipe.rating)}
              </span>
              ({formatNumber(recipe.reviewsCount)} نظر)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <Badge key={tag} tone="primary">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-primary-light px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold text-primary-dark">
              <ChefHat className="size-4" />
              تعداد نفرات
            </span>
            <div className="flex items-center gap-2">
              <IconButton
                label="کاهش نفرات"
                size="sm"
                variant="outline"
                onClick={() => onServingsChange(Math.max(1, servings - 1))}
              >
                <span className="text-lg font-bold leading-none">−</span>
              </IconButton>
              <span className="w-10 text-center text-base font-extrabold text-primary-dark">
                {formatNumber(servings)}
              </span>
              <IconButton
                label="افزایش نفرات"
                size="sm"
                variant="outline"
                onClick={() => onServingsChange(servings + 1)}
              >
                <span className="text-lg font-bold leading-none">+</span>
              </IconButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                addRecipe(recipe, servings);
                toast("مواد لازم به لیست خرید اضافه شد");
              }}
            >
              <ShoppingCart className="size-4" />
              افزودن به لیست خرید
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toggleSaved(recipe.id);
                toast(
                  saved ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد",
                  saved ? "info" : "success",
                );
              }}
            >
              <Bookmark className={saved ? "size-4 fill-current" : "size-4"} />
              {saved ? "ذخیره شده" : "ذخیره دستور پخت"}
            </Button>
            <IconButton label="اشتراک‌گذاری" variant="outline" onClick={share}>
              <Share2 className="size-4" />
            </IconButton>
            <IconButton
              label="علاقه‌مندی"
              variant="outline"
              onClick={() => toggleSaved(recipe.id)}
            >
              <Heart className={saved ? "size-4 fill-danger text-danger" : "size-4"} />
            </IconButton>
          </div>
        </div>

        <div className="relative order-first overflow-hidden rounded-2xl lg:order-last">
          <FoodImage
            seed={recipe.id}
            src={recipe.image}
            alt={recipe.title}
            ratio="aspect-[16/11] lg:h-full"
          />
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
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 text-muted shadow-soft"
          >
            <Heart className={saved ? "size-5 fill-danger text-danger" : "size-5"} />
          </button>
        </div>
      </div>
    </section>
  );
}
