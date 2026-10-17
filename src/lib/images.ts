import { foodImage, productImage as productPlaceholder, avatarImage } from "@/lib/placeholder";

const RECIPE_IDS = new Set(
  Array.from({ length: 16 }, (_, i) => `r${i + 1}`),
);

function recipeIdFromSeed(seed: string): string | undefined {
  const match = seed.match(/r\d+/);
  return match?.[0];
}

/** Recipe photos from the API (`/static/food`) with a local fallback. */
export function recipePhoto(seed: string, image?: string): string {
  if (image) return image;
  const id = RECIPE_IDS.has(seed) ? seed : recipeIdFromSeed(seed);
  if (id && RECIPE_IDS.has(id)) return `/static/food/${id}.jpg`;
  return foodImage(seed);
}

export function productPhoto(_id: string, title = _id, image?: string): string {
  if (image) return image;
  return productPlaceholder(title);
}

export function userPhoto(nameOrUsername: string): string {
  return avatarImage(nameOrUsername);
}
