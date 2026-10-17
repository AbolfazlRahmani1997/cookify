import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { useSaved } from "@/context/SavedContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { getRecipesByIds } from "@/data/selectors";

export function FavoritesPage() {
  const { savedIds, savedRecipes } = useSaved();
  const catalog = useAsync(() => api.listRecipes(), []);
  const recipes =
    savedRecipes.length > 0
      ? savedRecipes
      : getRecipesByIds(catalog.data ?? [], savedIds);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">علاقه‌مندی‌ها</h1>
        <p className="mt-2 text-sm text-muted">
          دستور پخت‌هایی که ذخیره کرده‌ای اینجا می‌مانند.
        </p>
      </header>

      {recipes.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title="هنوز چیزی ذخیره نشده"
          description="روی قلب کارت دستور پخت بزن تا اینجا نمایش داده شود."
          action={
            <Link to="/assistant">
              <Button>کشف دستور پخت‌ها</Button>
            </Link>
          }
        />
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </div>
  );
}
