import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { RecipeHeaderCard } from "@/components/recipe/RecipeHeaderCard";
import { IngredientList } from "@/components/recipe/IngredientList";
import { IngredientChoices } from "@/components/recipe/IngredientChoices";
import { StepList } from "@/components/recipe/StepList";
import { TipsList } from "@/components/recipe/TipsList";
import { ReviewList } from "@/components/recipe/ReviewList";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { Tabs } from "@/components/common/Tabs";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Skeleton, GridSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { formatToman } from "@/lib/format";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { useCookSession } from "@/context/CookSessionContext";
import { watchPlan } from "@/lib/cookWatch";
import type { Product } from "@/data/types";

const TABS = [
  { id: "ingredients", label: "مواد لازم" },
  { id: "steps", label: "طرز تهیه" },
  { id: "tips", label: "نکات و ترفندها" },
  { id: "reviews", label: "نظرات" },
];

export function RecipePage() {
  const { id = "" } = useParams();
  const { data: recipe, loading, error, reload } = useAsync(
    () => api.getRecipe(id),
    [id],
  );
  const catalog = useAsync(() => api.listRecipes(), []);
  const market = useAsync(
    () =>
      recipe
        ? api.matchProducts(recipe.ingredients.map((ing) => ing.name))
        : Promise.resolve([] as Product[]),
    [recipe?.id, (recipe?.ingredients ?? []).map((ing) => ing.name).join("|")],
  );
  const { addItem, items, total } = useShoppingList();
  const { toast } = useToast();
  const cook = useCookSession();
  const [tab, setTab] = useState("ingredients");
  const [servings, setServings] = useState(4);

  useEffect(() => {
    setTab("ingredients");
  }, [id]);

  useEffect(() => {
    if (recipe) setServings(recipe.servings);
  }, [recipe]);

  const matchedProducts = market.data ?? [];

  const related = useMemo(
    () =>
      recipe
        ? (catalog.data ?? [])
            .filter((r) => r.id !== recipe.id && r.category === recipe.category)
            .slice(0, 4)
        : [],
    [recipe, catalog.data],
  );

  const goTo = (sectionId: string) => {
    setTab(sectionId);
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="aspect-[16/11] w-full" />
        </div>
        <Skeleton className="h-14 w-full" />
        <GridSkeleton count={4} />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={reload} />;

  if (!recipe) {
    return (
      <EmptyState
        icon={<SearchX className="size-7" />}
        title="دستور پخت پیدا نشد"
        description="ممکن است این دستور حذف شده باشد یا آدرس اشتباه باشد."
        action={
          <Link to="/assistant">
            <Button>بازگشت به دستور پخت‌ها</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <RecipeHeaderCard
        recipe={recipe}
        servings={servings}
        onServingsChange={setServings}
      />

      <div className="sticky top-[72px] z-30 -mx-1 px-1">
        <Tabs items={TABS} active={tab} onChange={goTo} />
      </div>

      <section id="ingredients" className="scroll-mt-32">
        <IngredientList
          ingredients={recipe.ingredients}
          servings={servings}
          baseServings={recipe.servings}
        />
      </section>

      <section id="steps" className="scroll-mt-32">
        <StepList
          steps={recipe.steps}
          activeStepId={
            cook.session?.recipeId === recipe.id && !cook.session.finished
              ? cook.session.stepId
              : undefined
          }
          onStartWatch={(step) => {
            const plan = watchPlan(step);
            if (!plan) return;
            void cook.start({
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              stepId: step.id,
              plan,
            });
          }}
        />
      </section>

      {recipe.tips.length > 0 && (
        <section id="tips" className="scroll-mt-32">
          <h3 className="mb-4 text-base font-extrabold text-ink">
            نکات و ترفندها
          </h3>
          <TipsList tips={recipe.tips} />
        </section>
      )}

      <section id="reviews" className="scroll-mt-32">
        <h3 className="mb-4 text-base font-extrabold text-ink">
          نظرات کاربران ({recipe.reviews.length})
        </h3>
        <ReviewList reviews={recipe.reviews} />
      </section>

      {matchedProducts.length > 0 && (
        <section aria-labelledby="market-heading" className="space-y-2">
          <SectionHeader
            title="انتخاب محصول هر ماده"
            subtitle="یک گزینه را بزن و تأیید کن"
          />
          {recipe.ingredients.map((ing) => {
            const options = matchedProducts
              .filter((product) => product.matches.includes(ing.name))
              .slice(0, 5);
            const confirmed = items.find((item) => item.name === ing.name && item.productId);
            return (
              <IngredientChoices
                key={ing.id}
                ingredient={ing.name}
                options={options}
                confirmedId={confirmed?.productId}
                onConfirm={(product) => {
                  addItem({
                    ingredientId: ing.id,
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                    productId: product.id,
                  });
                  void api.recordChoice(ing.name, product.id).catch(() => undefined);
                  toast(`${ing.name} به لیست خرید اضافه شد`);
                }}
              />
            );
          })}
          <p className="text-sm font-extrabold text-ink">
            جمع لیست خرید: {formatToman(total)}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <SectionHeader
            title="دستور پخت‌های مشابه"
            subtitle="اگر این غذا را دوست داشتی، اینها را هم امتحان کن"
          />
          <h2 id="related-heading" className="sr-only">
            دستور پخت‌های مشابه
          </h2>
          <RecipeGrid recipes={related} />
        </section>
      )}
    </div>
  );
}
