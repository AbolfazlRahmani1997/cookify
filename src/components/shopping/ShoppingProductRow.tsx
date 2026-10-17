import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatToman, formatNumber, discountPercent } from "@/lib/format";
import { useShoppingList } from "@/context/ShoppingListContext";
import type { ShoppingListItem } from "@/data/types";

export function ShoppingProductRow({
  item,
  onAmount,
  onRemove,
}: {
  item: ShoppingListItem;
  onAmount: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
}) {
  const { productById } = useShoppingList();
  const product = item.productId ? productById(item.productId) : undefined;
  const off = product ? discountPercent(product.price, product.discount) : 0;
  const finalPrice = product ? product.price - product.discount : 0;
  const countUnit = ["عدد", "حبه", "برش", "قاشق", "نفر"].some((u) =>
    item.unit.includes(u),
  );
  const step = countUnit ? 1 : 50;

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border border-line bg-surface p-3",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{item.name}</p>
        <p className="mt-0.5 text-[11px] text-muted">
          {formatNumber(item.amount)} {item.unit}
        </p>
        {product ? (
          <p className="mt-1 flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-primary-dark">
              {formatToman(finalPrice)}
            </span>
            {off > 0 && (
              <span className="text-[11px] text-muted line-through">
                {formatToman(product.price)}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-muted">قیمت نامشخص</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-xl border border-line p-0.5">
          <button
            type="button"
            aria-label={`افزایش ${item.name}`}
            onClick={() => onAmount(item.id, item.amount + step)}
            className="grid size-7 place-items-center rounded-lg bg-primary-light text-primary-dark transition-colors hover:bg-primary hover:text-white"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`کاهش ${item.name}`}
            onClick={() => onAmount(item.id, Math.max(step, item.amount - step))}
            className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas"
          >
            <Minus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          aria-label={`حذف ${item.name}`}
          onClick={() => onRemove(item.id)}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5 text-muted hover:text-danger" />
        </button>
      </div>
    </li>
  );
}
