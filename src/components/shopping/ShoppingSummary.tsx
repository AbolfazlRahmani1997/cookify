import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { formatToman } from "@/lib/format";

export function ShoppingSummary({
  subtotal,
  discount,
  total,
  itemCount,
  compact = false,
}: {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/70 p-4">
      {!compact && (
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <Sparkles className="size-4 text-accent" />
          مخصوص {itemCount} قلم کالا
        </div>
      )}
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">جمع سبد</dt>
          <dd className="font-bold text-ink">{formatToman(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">تخفیف</dt>
          <dd className="font-bold text-primary-dark">
            {discount > 0 ? `− ${formatToman(discount)}` : "—"}
          </dd>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-line pt-3">
          <dt className="font-bold text-ink">مبلغ قابل پرداخت</dt>
          <dd className="text-lg font-extrabold text-primary-dark">
            {formatToman(total)}
          </dd>
        </div>
      </dl>

      <Link to="/shopping-list" className="mt-4 block">
        <Button fullWidth className="gap-2">
          <ShoppingBag className="size-4" />
          تکمیل لیست خرید
        </Button>
      </Link>
      <p className="mt-2 text-center text-[11px] leading-5 text-muted">
        قیمت‌ها تقریبی و صرفاً جهت نمایش است.
      </p>
    </div>
  );
}
