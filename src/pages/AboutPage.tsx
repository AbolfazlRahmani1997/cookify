import { Link } from "react-router-dom";
import { ChefHat, Heart, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { LogoLockup } from "@/components/layout/Logo";

const VALUES = [
  {
    icon: Sparkles,
    title: "پیشنهاد هوشمند",
    text: "با مواد موجود، زمان و سلیقه‌ات بهترین غذا را پیدا کن.",
  },
  {
    icon: ShoppingCart,
    title: "خرید آسان",
    text: "مواد لازم هر دستور را با یک کلیک به لیست خریدت اضافه کن.",
  },
  {
    icon: Heart,
    title: "جامعه آشپزی",
    text: "دست‌پخت‌هایت را به اشتراک بگذار و از تجربه دیگران الهام بگیر.",
  },
];

export function AboutPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4 text-center">
          <LogoLockup className="mx-auto max-w-[180px]" />
          <h1 className="text-3xl font-extrabold text-ink">درباره Cookify</h1>
          <p className="text-sm leading-8 text-muted">
            Cookify یک دستیار آشپزی فارسی است: از ایده تا میز غذا. مواد داخل
            یخچال را بگو، زمانت را مشخص کن، و بهترین دستور را بگیر. بعد لیست خرید
            را بساز و نتیجه را با جامعه به اشتراک بگذار.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title} className="card p-5 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-light text-primary-dark">
                <v.icon className="size-6" />
              </span>
              <h2 className="mt-3 text-sm font-extrabold text-ink">{v.title}</h2>
              <p className="mt-2 text-xs leading-6 text-muted">{v.text}</p>
            </li>
          ))}
        </ul>

        <div className="rounded-3xl bg-primary-light p-8 text-center">
          <ChefHat className="mx-auto size-8 text-primary-dark" />
          <p className="mt-3 text-lg font-extrabold text-ink">
            آماده‌ای امروز چی بپزیم؟
          </p>
          <Link to="/assistant" className="mt-5 inline-block">
            <Button>شروع کن</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
