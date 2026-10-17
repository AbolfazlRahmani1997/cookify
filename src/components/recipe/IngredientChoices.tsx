import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/common/Button";
import { formatToman } from "@/lib/format";
import { productPhoto } from "@/lib/images";
import { productImage } from "@/lib/placeholder";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";

export function IngredientChoices({
  ingredient,
  options,
  confirmedId,
  onConfirm,
}: {
  ingredient: string;
  options: Product[];
  confirmedId?: string;
  onConfirm: (product: Product) => void;
}) {
  const [picked, setPicked] = useState(confirmedId ?? "");
  const selected = options.find((product) => product.id === (picked || confirmedId));

  return (
    <section className="card space-y-2 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-extrabold text-ink">{ingredient}</h3>
        {confirmedId && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-dark">
            <Check className="size-3" />
            در لیست
          </span>
        )}
      </div>
      {options.length === 0 ? (
        <p className="text-[11px] text-muted">گزینه‌ای پیدا نشد.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {options.slice(0, 5).map((product) => {
            const active = product.id === (picked || confirmedId);
            const price = product.price - product.discount;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => setPicked(product.id)}
                  className={cn(
                    "flex max-w-44 items-center gap-1.5 rounded-xl border py-1 pe-2 ps-1 text-right text-[11px] transition",
                    active ? "border-primary bg-primary-light text-primary-dark" : "border-line text-ink hover:bg-canvas",
                  )}
                >
                  <img
                    src={productPhoto(product.id, product.title, product.image)}
                    alt=""
                    className="size-8 shrink-0 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = productImage(product.title);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{product.title}</span>
                    <span className="text-muted">{formatToman(price)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        type="button"
        size="sm"
        disabled={!selected}
        onClick={() => selected && onConfirm(selected)}
        className="h-8 px-3 text-xs"
      >
        تأیید
      </Button>
    </section>
  );
}
