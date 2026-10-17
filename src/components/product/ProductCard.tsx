import { Plus, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { discountPercent, formatNumber, formatToman } from "@/lib/format";
import { productPhoto } from "@/lib/images";
import { productImage } from "@/lib/placeholder";
import type { Product } from "@/data/types";

export function ProductCard({
  product,
  onAdd,
  className,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  className?: string;
}) {
  const { addItem } = useShoppingList();
  const { toast } = useToast();
  const off = discountPercent(product.price, product.discount);
  const finalPrice = product.price - product.discount;
  const disabled = product.availability === "out-of-stock";

  return (
    <article className={cn("card flex w-36 shrink-0 snap-start flex-col overflow-hidden sm:w-40", className)}>
      <div className="relative">
        <img
          src={productPhoto(product.id, product.title, product.image)}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = productImage(product.title);
          }}
          className="aspect-[4/5] w-full object-cover"
        />
        {off > 0 && (
          <span className="absolute right-1.5 top-1.5">
            <Badge tone="danger">٪{formatNumber(off)}</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-xs font-bold leading-5 text-ink">
          {product.title}
        </h3>
        <div className="mt-1 flex items-end justify-between gap-1">
          <div className="min-w-0">
            {off > 0 && (
              <p className="truncate text-[10px] text-muted line-through">
                {formatToman(product.price)}
              </p>
            )}
            <p className="truncate text-xs font-extrabold text-ink">
              {formatToman(finalPrice)}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              addItem({
                ingredientId: product.id,
                name: product.title,
                amount: 1,
                unit: product.unit,
                productId: product.id,
              });
              onAdd?.(product);
              toast("محصول به لیست خرید اضافه شد");
            }}
            aria-label={
              disabled
                ? `${product.title} ناموجود است`
                : `افزودن ${product.title} به لیست خرید`
            }
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-lg transition-colors",
              disabled
                ? "cursor-not-allowed bg-canvas text-muted"
                : "bg-primary text-white hover:bg-primary-dark",
            )}
          >
            {disabled ? (
              <ShoppingBag className="size-3" />
            ) : (
              <Plus className="size-3" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
