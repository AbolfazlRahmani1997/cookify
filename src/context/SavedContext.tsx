import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/data/api";
import { useAuth } from "@/context/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Recipe } from "@/data/types";

interface SavedContextValue {
  savedIds: string[];
  savedRecipes: Recipe[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [localIds, setLocalIds] = useLocalStorage<string[]>(
    "cookify.saved-recipes",
    ["r1", "r4"],
  );
  const [remoteIds, setRemoteIds] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      setSavedRecipes([]);
      return;
    }
    api
      .getSavedRecipes()
      .then((recipes) => {
        setSavedRecipes(recipes);
        setRemoteIds(recipes.map((r) => r.id));
      })
      .catch(() => {
        setSavedRecipes([]);
        setRemoteIds([]);
      });
  }, [isLoggedIn]);

  const savedIds = isLoggedIn ? remoteIds : localIds;

  const toggleSaved = useCallback(
    (id: string) => {
      if (isLoggedIn) {
        const was = remoteIds.includes(id);
        setRemoteIds((prev) =>
          was ? prev.filter((x) => x !== id) : [...prev, id],
        );
        api
          .toggleSaved(id)
          .then((res) => {
            setRemoteIds((prev) => {
              const has = prev.includes(id);
              if (res.saved && !has) return [...prev, id];
              if (!res.saved && has) return prev.filter((x) => x !== id);
              return prev;
            });
            return api.getSavedRecipes();
          })
          .then(setSavedRecipes)
          .catch(() => {
            setRemoteIds((prev) =>
              was ? [...prev, id] : prev.filter((x) => x !== id),
            );
          });
        return;
      }
      setLocalIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [isLoggedIn, remoteIds, setLocalIds],
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const value = useMemo(
    () => ({ savedIds, savedRecipes, isSaved, toggleSaved }),
    [savedIds, savedRecipes, isSaved, toggleSaved],
  );

  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
