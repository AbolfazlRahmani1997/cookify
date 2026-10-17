import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product, Recipe, ShoppingListItem } from "@/data/types";
import { api, findProductFor, mergeProductCache, productById as lookupProduct, setProductCache } from "@/data/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const DEFAULT_ITEMS: ShoppingListItem[] = [
  { id: "r1-r1-i1", ingredientId: "r1-i1", name: "پاستا", amount: 400, unit: "گرم", checked: false, productId: "p1" },
  { id: "r1-r1-i2", ingredientId: "r1-i2", name: "سینه مرغ", amount: 500, unit: "گرم", checked: false, productId: "p2" },
  { id: "r1-r1-i3", ingredientId: "r1-i3", name: "خامه صبحانه", amount: 200, unit: "گرم", checked: false, productId: "p3" },
  { id: "r1-r1-i4", ingredientId: "r1-i4", name: "قارچ", amount: 200, unit: "گرم", checked: false, productId: "p4" },
  { id: "r1-r1-i5", ingredientId: "r1-i5", name: "کره", amount: 50, unit: "گرم", checked: false, productId: "p5" },
  { id: "r1-r1-i6", ingredientId: "r1-i6", name: "پنیر پارمزان", amount: 100, unit: "گرم", checked: false, productId: "p6" },
];

interface ShoppingListContextValue {
  items: ShoppingListItem[];
  addRecipe: (recipe: Recipe, servings?: number) => void;
  addItem: (item: Omit<ShoppingListItem, "id" | "checked">) => void;
  chooseProduct: (itemId: string, product: Product) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  setAmount: (id: string, amount: number) => void;
  clear: () => void;
  count: number;
  checkedCount: number;
  subtotal: number;
  discount: number;
  total: number;
  has: (recipeId: string) => boolean;
  productById: (id: string) => Product | undefined;
}

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<ShoppingListItem[]>(
    "cookify.shopping-list.v2",
    DEFAULT_ITEMS,
  );
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    api
      .listProducts()
      .then((products) => {
        setCatalog(products);
        setProductCache(products);
      })
      .catch(() => undefined);
  }, []);

  const namesKey = items.map((i) => i.name).join("|");
  useEffect(() => {
    const names = namesKey.split("|").filter(Boolean);
    if (names.length === 0) return;
    api
      .matchProducts(names)
      .then((products) => {
        setCatalog((prev) => {
          const byId = new Map(prev.map((p) => [p.id, p]));
          for (const p of products) byId.set(p.id, p);
          const next = [...byId.values()];
          mergeProductCache(next);
          return next;
        });
      })
      .catch(() => undefined);
  }, [namesKey, setItems]);

  const productById = useCallback(
    (id: string) => catalog.find((p) => p.id === id) ?? lookupProduct(id),
    [catalog],
  );

  const addRecipe = useCallback(
    (recipe: Recipe, servings?: number) => {
      const factor =
        servings && recipe.servings ? servings / recipe.servings : 1;
      setItems((prev) => {
        const next = [...prev];
        recipe.ingredients.forEach((ing) => {
          const product = findProductFor(ing.name);
          const existing = next.find((i) => i.ingredientId === ing.id);
          const amount =
            ing.unit === "به مقدار لازم"
              ? ing.amount
              : Math.round(ing.amount * factor * 10) / 10;
          if (existing) {
            existing.amount += amount;
          } else {
            next.push({
              id: `${recipe.id}-${ing.id}`,
              ingredientId: ing.id,
              name: ing.name,
              amount,
              unit: ing.unit,
              checked: false,
              productId: product?.id,
            });
          }
        });
        return next;
      });
    },
    [setItems],
  );

  const chooseProduct = useCallback(
    (itemId: string, product: Product) => {
      setCatalog((prev) => {
        const next = [...prev.filter((p) => p.id !== product.id), product];
        mergeProductCache(next);
        return next;
      });
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, productId: product.id } : item)),
      );
    },
    [setItems],
  );

  const addItem = useCallback(
    (item: Omit<ShoppingListItem, "id" | "checked">) => {
      setItems((prev) => {
        if (prev.some((i) => i.name === item.name)) {
          return prev.map((i) =>
            i.name === item.name ? { ...i, productId: item.productId ?? i.productId } : i,
          );
        }
        return [
          ...prev,
          {
            ...item,
            id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            checked: false,
          },
        ];
      });
    },
    [setItems],
  );

  const removeItem = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [setItems],
  );

  const toggleItem = useCallback(
    (id: string) =>
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
      ),
    [setItems],
  );

  const setAmount = useCallback(
    (id: string, amount: number) =>
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, amount: Math.max(0, amount) } : i)),
      ),
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  const has = useCallback(
    (recipeId: string) =>
      items.some((i) => i.ingredientId.startsWith(`${recipeId}-`)),
    [items],
  );

  const derived = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    items.forEach((item) => {
      const product = item.productId ? productById(item.productId) : undefined;
      if (!product) return;
      subtotal += product.price;
      discount += product.discount;
    });
    return {
      subtotal,
      discount,
      total: subtotal - discount,
      count: items.length,
      checkedCount: items.filter((i) => i.checked).length,
    };
  }, [items, productById]);

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      items,
      addRecipe,
      addItem,
      chooseProduct,
      removeItem,
      toggleItem,
      setAmount,
      clear,
      has,
      productById,
      ...derived,
    }),
    [items, addRecipe, addItem, chooseProduct, removeItem, toggleItem, setAmount, clear, has, productById, derived],
  );

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx)
    throw new Error("useShoppingList must be used within ShoppingListProvider");
  return ctx;
}
