import type { Recipe } from "@/data/types";

export function getRecipesByIds(recipes: Recipe[], ids: string[]): Recipe[] {
  const map = new Map(recipes.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((r): r is Recipe => Boolean(r));
}
