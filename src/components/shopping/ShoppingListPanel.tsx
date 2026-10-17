import { Link } from "react-router-dom";
import { MapPin, Share2, ShoppingCart, Trash2 } from "lucide-react";
import { ShoppingProductRow } from "@/components/shopping/ShoppingProductRow";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { formatNumber, formatToman } from "@/lib/format";

export function ShoppingListPanel({
  variant = "page",
  className,
}: {
  variant?: "page" | "sidebar";
  className?: string;
}) {
  const {
    items,
    setAmount,
    removeItem,
    clear,
    total,
    checkedCount,
  } = useShoppingList();
  const { toast } = useToast();
  const compact = variant === "sidebar";

  const shareList = async () => {
    const lines = items.map(
      (item) => `• ${item.name} — ${formatNumber(item.amount)} ${item.unit}`,
    );
    const text = [`لیست خرید Cookify`, ...lines, `جمع حدودی: ${formatToman(total)}`].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "لیست خرید", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast("لیست خرید کپی شد، بفرست برای خرید", "success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        toast("لیست خرید کپی شد، بفرست برای خرید", "success");
      } catch {
        toast("ارسال لیست انجام نشد", "info");
      }
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        className={cn(className, compact && "px-3 py-8")}
        icon={<ShoppingCart className="size-7" />}
        title="لیست خرید خالی است"
        description="یک دستور پخت باز کن و مواد لازم را به لیست خرید اضافه کن."
        action={
          <Link to="/assistant">
            <Button variant="secondary">مشاهده دستور پخت‌ها</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <ShoppingCart className="size-4 text-primary" />
            لیست خرید
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
              {formatNumber(items.length)}
            </span>
          </h2>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="size-3" />
            مواد لازم دستورهایی که انتخاب کردی
          </p>
        </div>
        <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => void shareList()}
          aria-label="ارسال لیست خرید"
          title="کپی و ارسال برای خرید"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-primary"
        >
          <Share2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            clear();
            toast("لیست خرید پاک شد", "info");
          }}
          aria-label="پاک کردن همه"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
        </div>
      </header>

      <ul className={cn("space-y-2", compact && "space-y-1.5")}>
        {items.map((item) => (
          <ShoppingProductRow
            key={item.id}
            item={item}
            onAmount={setAmount}
            onRemove={(id) => {
              removeItem(id);
              toast("از لیست خرید حذف شد", "info");
            }}
          />
        ))}
      </ul>

      <div className="rounded-2xl bg-canvas/70 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">مجموع حدودی</span>
          <span className="text-lg font-extrabold text-primary-dark">
            {formatToman(total)}
          </span>
        </div>
        {checkedCount > 0 && (
          <p className="mt-1 text-[11px] text-muted">
            {formatNumber(checkedCount)} قلم تهیه شده است
          </p>
        )}
      </div>

      <Link to="/shopping-list" className="block">
        <Button fullWidth className="gap-2">
          <ShoppingCart className="size-4" />
          مشاهده لیست کامل
        </Button>
      </Link>
      <p className="text-center text-[10px] leading-5 text-muted">
        قیمت‌ها تقریبی و صرفاً جهت نمایش است.
      </p>
    </div>
  );
}
