import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  emptyWeekPlan,
  fillWeekDinners,
  setTonightDinner,
  setTomorrowDinner,
  type MealPlan,
  type PendingMealAction,
} from "@/lib/mealPlan";
import { useAuth } from "@/context/AuthContext";

const PLAN_KEY = "cookify.mealPlan.v1";
const PENDING_KEY = "cookify.pendingMealAction";

function readPlan(): MealPlan {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return emptyWeekPlan();
    const parsed = JSON.parse(raw) as MealPlan;
    if (!parsed?.days?.length) return emptyWeekPlan();
    // Refresh labels if the stored week started on another day.
    const todayKey = emptyWeekPlan().days[0]?.dateKey;
    if (parsed.days[0]?.dateKey !== todayKey) {
      const fresh = emptyWeekPlan();
      const byOld = new Map(parsed.days.map((d) => [d.dateKey, d]));
      return {
        days: fresh.days.map((d) => ({
          ...d,
          dinnerRecipeId: byOld.get(d.dateKey)?.dinnerRecipeId,
          lunchRecipeId: byOld.get(d.dateKey)?.lunchRecipeId,
        })),
        updatedAt: Date.now(),
      };
    }
    return parsed;
  } catch {
    return emptyWeekPlan();
  }
}

function readPending(): PendingMealAction | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingMealAction;
  } catch {
    return null;
  }
}

interface MealPlanContextValue {
  plan: MealPlan;
  pending: PendingMealAction | null;
  setPending: (action: PendingMealAction | null) => void;
  saveTonight: (recipeId: string) => void;
  saveTomorrow: (recipeId: string) => void;
  saveWeek: (recipeIds: string[]) => void;
  clearDayDinner: (dateKey: string) => void;
}

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [plan, setPlan] = useState<MealPlan>(() => readPlan());
  const [pending, setPendingState] = useState<PendingMealAction | null>(() => readPending());

  useEffect(() => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan]);

  const setPending = useCallback((action: PendingMealAction | null) => {
    setPendingState(action);
    if (action) sessionStorage.setItem(PENDING_KEY, JSON.stringify(action));
    else sessionStorage.removeItem(PENDING_KEY);
  }, []);

  const saveTonight = useCallback((recipeId: string) => {
    setPlan((p) => setTonightDinner(p.days.length ? p : emptyWeekPlan(), recipeId));
  }, []);

  const saveTomorrow = useCallback((recipeId: string) => {
    setPlan((p) => setTomorrowDinner(p.days.length ? p : emptyWeekPlan(), recipeId));
  }, []);

  const saveWeek = useCallback((recipeIds: string[]) => {
    setPlan((p) => fillWeekDinners(p.days.length ? p : emptyWeekPlan(), recipeIds));
  }, []);

  const clearDayDinner = useCallback((dateKey: string) => {
    setPlan((p) => ({
      ...p,
      updatedAt: Date.now(),
      days: p.days.map((d) =>
        d.dateKey === dateKey ? { ...d, dinnerRecipeId: undefined } : d,
      ),
    }));
  }, []);

  // Apply pending action after login.
  useEffect(() => {
    if (!isLoggedIn || !pending) return;
    if (pending.type === "save-tonight") saveTonight(pending.recipeId);
    else if (pending.type === "remind-tomorrow") saveTomorrow(pending.recipeId);
    else if (pending.type === "save-week") {
      saveWeek(pending.recipeIds?.length ? pending.recipeIds : [pending.recipeId]);
    }
    setPending(null);
  }, [isLoggedIn, pending, saveTonight, saveTomorrow, saveWeek, setPending]);

  const value = useMemo(
    () => ({
      plan,
      pending,
      setPending,
      saveTonight,
      saveTomorrow,
      saveWeek,
      clearDayDinner,
    }),
    [plan, pending, setPending, saveTonight, saveTomorrow, saveWeek, clearDayDinner],
  );

  return (
    <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used within MealPlanProvider");
  return ctx;
}
