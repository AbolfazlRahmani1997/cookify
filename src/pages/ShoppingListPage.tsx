import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { ShoppingListPanel } from "@/components/shopping/ShoppingListPanel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { IngredientChoices } from "@/components/recipe/IngredientChoices";
import { Banner } from "@/components/common/Banner";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { TextField } from "@/components/common/TextField";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { BANNERS } from "@/lib/banners";
import { useShoppingList } from "@/context/ShoppingListContext";

export function ShoppingListPage() {
  const { items, productById, chooseProduct } = useShoppingList();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 400);
    return () => window.clearTimeout(t);
  }, [q]);

  const namesKey = items.map((i) => i.name).join("|");
  const matchedState = useAsync(
    () => api.matchProducts(items.map((i) => i.name)),
    [namesKey],
  );
  const search = useAsync(
    () =>
      debounced.length >= 2
        ? api.listProducts(debounced)
        : Promise.resolve([]),
    [debounced],
  );

  const productIds = new Set(items.map((i) => i.productId).filter(Boolean));
  const fromList = (matchedState.data ?? []).filter((p) => productIds.has(p.id));
  const extraMatched = items
    .map((i) => (i.productId ? productById(i.productId) : undefined))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const matched = fromList.length > 0 ? fromList : extraMatched;
  const suggestions =
    debounced.length >= 2
      ? (search.data ?? []).filter((p) => !productIds.has(p.id))
      : (matchedState.data ?? []).filter((p) => !productIds.has(p.id));

  return (
    <div className="space-y-10">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-bold text-primary-dark">
          <ShoppingCart className="size-4" />
          خرید هوشمند
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
          لیست خرید
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          مواد لازم دستورهایی که انتخاب کردی، یک‌جا و با قیمت تقریبی.
        </p>
      </header>

      <Banner
        src={BANNERS.assistant}
        alt="لیست خرید Cookify"
        className="shadow-card"
      />

      <TextField
        label="جستجوی محصول"
        name="product-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="مثلاً مرغ، رب، روغن…"
        icon={<Search className="size-4" />}
      />

      <ShoppingListPanel />

      {items
        .filter((item) => !item.productId)
        .map((item) => (
          <IngredientChoices
            key={item.id}
            ingredient={item.name}
            options={(matchedState.data ?? [])
              .filter((product) => product.matches.includes(item.name))
              .slice(0, 5)}
            onConfirm={(product) => {
              chooseProduct(item.id, product);
              void api.recordChoice(item.name, product.id).catch(() => undefined);
            }}
          />
        ))}

      {(matchedState.loading || search.loading) && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-36 shrink-0 sm:w-40" />
          ))}
        </div>
      )}

      {!search.loading && search.error && debounced.length >= 2 && (
        <ErrorState description={search.error} onRetry={search.reload} />
      )}

      {!matchedState.loading && !matchedState.error && matched.length > 0 && (
        <section aria-labelledby="matched-heading">
          <SectionHeader
            title="محصولات انتخاب‌شده"
            subtitle="منطبق با مواد لیست خرید شما"
          />
          <h2 id="matched-heading" className="sr-only">
            محصولات انتخاب‌شده
          </h2>
          <ProductGrid products={matched} />
        </section>
      )}

      {!search.loading && !matchedState.loading && suggestions.length > 0 && (
        <section aria-labelledby="suggested-heading">
          <SectionHeader
            title={debounced.length >= 2 ? "نتایج جستجو" : "پیشنهاد محصول"}
            subtitle={
              debounced.length >= 2
                ? `جستجو برای «${debounced}»`
                : "محصولات مرتبط با مواد لیست خرید"
            }
          />
          <h2 id="suggested-heading" className="sr-only">
            پیشنهاد محصول
          </h2>
          <ProductGrid products={suggestions.slice(0, 10)} />
        </section>
      )}
    </div>
  );
}
