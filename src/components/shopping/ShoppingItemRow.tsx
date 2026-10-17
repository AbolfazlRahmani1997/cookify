import { Check, Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/cn";
import { formatNumber, formatToman, discountPercent } from "@/lib/format";
import { useShoppingList } from "@/context/ShoppingListContext";
import type { ShoppingListItem } from "@/data/types";

export function ShoppingItemRow({
  item,
  onToggle,
  onAmount,
  onRemove,
  compact = false,
}: {
  item: ShoppingListItem;
  onToggle: (id: string) => void;
  onAmount: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  const { productById } = useShoppingList();
  const product = item.productId ? productById(item.productId) : undefined;
  const finalPrice = product ? product.price - product.discount : 0;
  const off = product ? discountPercent(product.price, product.discount) : 0;
  const countUnit = ["عدد", "حبه", "برش", "قاشق", "نفر"].some((u) =>
    item.unit.includes(u),
  );
  const step = countUnit ? 1 : 50;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors",
        item.checked && "bg-canvas/60",
        compact && "gap-2 p-2.5",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={`${item.checked ? "برداشتن تیک" : "تیک زدن"} ${item.name}`}
        onClick={() => onToggle(item.id)}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-lg border transition-colors",
          item.checked
            ? "border-primary bg-primary text-white"
            : "border-line bg-surface text-transparent hover:border-primary/50",
        )}
      >
        <Check className="size-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-bold text-ink",
            item.checked && "text-muted line-through",
          )}
        >
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {formatNumber(item.amount)} {item.unit}
          {product && (
            <>
              <span className="mx-1.5">•</span>
              {product.brand}
            </>
          )}
        </p>
        {!compact && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {product ? (
              <>
                <span className="text-sm font-extrabold text-ink">
                  {formatToman(finalPrice)}
                </span>
                {off > 0 && (
                  <>
                    <span className="text-xs text-muted line-through">
                      {formatToman(product.price)}
                    </span>
                    <Badge tone="danger">٪{formatNumber(off)}</Badge>
                  </>
                )}
                {product.availability === "out-of-stock" && (
                  <Badge tone="danger">ناموجود</Badge>
                )}
                {product.availability === "low-stock" && (
                  <Badge tone="accent">موجودی کم</Badge>
                )}
              </>
            ) : (
              <Badge tone="muted">قیمت در دسترس نیست</Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <QuantityStepper
          value={item.amount}
          onChange={(v) => onAmount(item.id, v)}
          step={step}
          className={compact ? "scale-90" : undefined}
        />
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`حذف ${item.name}`}
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-danger"
        >
          <Trash2 className="size-3.5" />
          حذف
        </button>
      </div>
    </li>
  );
}
