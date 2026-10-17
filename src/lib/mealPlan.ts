import type { Recipe } from "@/data/types";

export type MealSlot = "lunch" | "dinner";

export interface MealPlanDay {
  dateKey: string; // YYYY-MM-DD
  label: string;
  dinnerRecipeId?: string;
  lunchRecipeId?: string;
}

export interface MealPlan {
  days: MealPlanDay[];
  updatedAt: number;
}

export interface TonightAnswers {
  servings: number;
  timeMinutes: number;
  mood: string;
  moodLabel: string;
}

export interface PendingMealAction {
  type: "save-tonight" | "save-week" | "remind-tomorrow";
  recipeId: string;
  recipeIds?: string[];
  answers: TonightAnswers;
}

export const WEEKDAY_FA = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKeyFrom(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function emptyWeekPlan(from = startOfToday()): MealPlan {
  const days: MealPlanDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    days.push({
      dateKey: dateKeyFrom(d),
      label: i === 0 ? "امشب" : i === 1 ? "فردا" : WEEKDAY_FA[d.getDay()],
    });
  }
  return { days, updatedAt: Date.now() };
}

/** Fill dinner slots starting tonight with the given recipe ids (cycle if short). */
export function fillWeekDinners(plan: MealPlan, recipeIds: string[]): MealPlan {
  if (!recipeIds.length) return plan;
  return {
    ...plan,
    updatedAt: Date.now(),
    days: plan.days.map((day, i) => ({
      ...day,
      dinnerRecipeId: recipeIds[i % recipeIds.length],
    })),
  };
}

export function setTonightDinner(plan: MealPlan, recipeId: string): MealPlan {
  if (!plan.days.length) return plan;
  const days = plan.days.map((d, i) =>
    i === 0 ? { ...d, dinnerRecipeId: recipeId } : d,
  );
  return { ...plan, days, updatedAt: Date.now() };
}

export function setTomorrowDinner(plan: MealPlan, recipeId: string): MealPlan {
  if (plan.days.length < 2) return setTonightDinner(plan, recipeId);
  const days = plan.days.map((d, i) =>
    i === 1 ? { ...d, dinnerRecipeId: recipeId } : d,
  );
  return { ...plan, days, updatedAt: Date.now() };
}

export function pickWeekRecipes(
  seed: Recipe,
  catalog: Recipe[],
  count = 7,
): Recipe[] {
  const pool = catalog.filter((r) => r.category === "غذای اصلی" || r.id === seed.id);
  const ranked = [...pool].sort((a, b) => {
    const cat = Number(a.category === seed.category) - Number(b.category === seed.category);
    if (cat !== 0) return -cat;
    return b.rating - a.rating;
  });
  const out: Recipe[] = [seed];
  for (const r of ranked) {
    if (out.some((x) => x.id === r.id)) continue;
    out.push(r);
    if (out.length >= count) break;
  }
  while (out.length < count) out.push(seed);
  return out.slice(0, count);
}
