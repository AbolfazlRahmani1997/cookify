import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { Recipe } from "@/data/types";
import { cn } from "@/lib/cn";

export function RecipeGrid({
  recipes,
  className,
  columns = "app",
}: {
  recipes: Recipe[];
  className?: string;
  columns?: "app" | "landing" | "two";
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        columns === "two" && "grid-cols-1 sm:grid-cols-2",
        columns === "app" && "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
        columns === "landing" && "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          variant={columns === "landing" ? "landing" : "app"}
        />
      ))}
    </div>
  );
}
