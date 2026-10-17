import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { foodIcon, foodTone } from "@/lib/foodIcons";
import type { Ingredient } from "@/data/types";

export function IngredientList({
  ingredients,
  servings,
  baseServings,
}: {
  ingredients: Ingredient[];
  servings: number;
  baseServings: number;
}) {
  const factor = baseServings ? servings / baseServings : 1;
  const groups: { title: string; items: Ingredient[] }[] = [];
  for (const ing of ingredients) {
    const title = ing.group?.trim() || "مواد اصلی";
    const found = groups.find((group) => group.title === title);
    if (found) found.items.push(ing);
    else groups.push({ title, items: [ing] });
  }
  const showGroups = groups.length > 1 || Boolean(ingredients[0]?.group);

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="mb-2 text-base font-extrabold text-ink">
        مواد لازم برای {formatNumber(servings)} نفر
      </h3>

      {groups.map((group) => (
        <div key={group.title} className="mt-3">
          {showGroups && (
            <h4 className="mb-1 text-xs font-extrabold text-primary-dark">{group.title}</h4>
          )}
          <ul className="divide-y divide-line">
        {group.items.map((ing) => {
          const Icon = foodIcon(ing.name);
          const scaled =
            ing.unit === "به مقدار لازم"
              ? null
              : Math.round(ing.amount * factor * 10) / 10;
          return (
            <li
              key={ing.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    foodTone(ing.name),
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
                <span className="truncate text-sm font-bold text-ink">
                  {ing.name}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">
                {scaled === null ? (
                  ing.unit
                ) : (
                  <>
                    {formatNumber(scaled)} {ing.unit}
                  </>
                )}
              </span>
            </li>
          );
        })}
          </ul>
        </div>
      ))}
    </div>
  );
}
