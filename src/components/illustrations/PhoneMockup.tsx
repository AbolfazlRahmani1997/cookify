import { ChefHat, ChevronLeft, Search, Star } from "lucide-react";
import { FoodImage } from "@/components/common/FoodImage";
import { cn } from "@/lib/cn";

const CATEGORY_ICONS = ["🍳", "🍲", "🥗", "🍰"];

function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-[228px] shrink-0 overflow-hidden rounded-[2.4rem] border-[7px] border-ink bg-white shadow-pop",
        className,
      )}
    >
      <span className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-ink" />
      {children}
    </div>
  );
}

export function PhoneAssistant() {
  return (
    <PhoneFrame>
      <div className="flex flex-col gap-3 bg-white px-3 pb-4 pt-7">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-ink">
            <span className="grid size-5 place-items-center rounded-lg bg-primary-light text-primary-dark">
              <ChefHat className="size-3" />
            </span>
            Cookify
          </span>
          <span className="size-4 rounded-full bg-canvas" />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-canvas px-2 py-1.5">
          <Search className="size-3 text-muted" />
          <span className="text-[9px] text-muted">دنبال چه غذایی هستی؟</span>
        </div>

        <div className="flex gap-1.5">
          {["صبحانه", "شام", "ناهار", "دسر"].map((c, i) => (
            <span
              key={c}
              className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-primary-light/60 py-1.5 text-[8px] font-bold text-primary-dark"
            >
              <span className="text-[11px]">{CATEGORY_ICONS[i]}</span>
              {c}
            </span>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl">
          <div className="relative">
            <FoodImage seed="r1" alt="پاستا آلفردو" ratio="aspect-[16/10]" />
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[8px] font-bold text-ink">
              ۳۰ دقیقه
            </span>
          </div>
          <div className="px-1 pt-1.5">
            <p className="text-[10px] font-extrabold text-ink">پاستا آلفردو</p>
            <p className="mt-0.5 flex items-center gap-1 text-[8px] text-muted">
              <Star className="size-2.5 fill-accent text-accent" />
              ۴.۸
              <span className="mx-0.5">•</span>
              ۲۲۲ نظر
            </p>
          </div>
        </div>

        <p className="text-[9px] font-extrabold text-ink">
          پیشنهاد ویژه برای شما
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {["r2", "r3"].map((id) => (
            <div key={id} className="overflow-hidden rounded-lg">
              <FoodImage seed={id} alt="پیشنهاد" ratio="aspect-square" />
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

export function PhoneShopping() {
  const rows = [
    { name: "سینه مرغ", qty: "۵۰۰ گرم", price: "۱۲۸,۰۰۰", id: "p2" },
    { name: "خامه صبحانه", qty: "۲۰۰ گرم", price: "۴۱,۰۰۰", id: "p3" },
    { name: "قارچ", qty: "۲۵۰ گرم", price: "۳۶,۰۰۰", id: "p4" },
    { name: "پنیر پارمزان", qty: "۱۰۰ گرم", price: "۹۸,۰۰۰", id: "p6" },
  ];

  return (
    <PhoneFrame>
      <div className="flex flex-col gap-2.5 bg-white px-3 pb-4 pt-7">
        <div className="flex items-center gap-2">
          <ChevronLeft className="size-3.5 text-muted" />
          <p className="text-[11px] font-extrabold text-ink">لیست خرید</p>
        </div>

        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between rounded-xl border border-line p-2"
            >
              <div>
                <p className="text-[9px] font-bold text-ink">{r.name}</p>
                <p className="text-[8px] text-muted">{r.qty}</p>
                <p className="mt-0.5 text-[9px] font-extrabold text-primary-dark">
                  {r.price} تومان
                </p>
              </div>
              <FoodImage
                seed={r.id}
                alt={r.name}
                ratio="aspect-square"
                className="size-8 rounded-lg"
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-primary py-2 text-center text-[9px] font-bold text-white">
          مشاهده در فروشگاه
        </div>
      </div>
    </PhoneFrame>
  );
}
