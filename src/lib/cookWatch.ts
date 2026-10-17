import type { RecipeStep } from "@/data/types";

export interface WatchPlan {
  totalMinutes: number;
  everyMinutes: number;
  reminder: string;
  label: string;
}

/** Steps that need a mid-cook check, such as rice resting or milk simmering. */
export function watchPlan(step: RecipeStep): WatchPlan | null {
  const text = `${step.title ?? ""} ${step.description}`;
  const rice = /برنج|دم کش/.test(text);
  const milk = /شیر/.test(text);
  const oven = /فر|گریل/.test(text);
  const simmer = /بجوش|جوش|قلقل/.test(text);
  const minutes = step.minutes ?? 0;
  const sensitive = rice || milk || oven || simmer;

  if (minutes < 8 && !sensitive) return null;

  const totalMinutes = minutes >= 8 ? minutes : rice ? 40 : oven ? 25 : 15;
  const everyMinutes = rice
    ? 8
    : milk
      ? 4
      : oven
        ? 10
        : Math.min(10, Math.max(5, Math.round(totalMinutes / 4)));

  const reminder = rice
    ? "در قابلمه را بردار و برنج را چک کن تا ته نگیرد."
    : milk
      ? "شیر را نگاه کن که سر نرود."
      : oven
        ? "فر را چک کن تا غذا خشک نشود."
        : simmer
          ? "شعله را نگاه کن؛ نباید بجوشد و سر برود."
          : "این مرحله را یک لحظه چک کن.";

  return {
    totalMinutes,
    everyMinutes,
    reminder,
    label:
      step.title?.trim() ||
      step.description.replace(/\s+/g, " ").trim().slice(0, 42),
  };
}
