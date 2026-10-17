import { Link } from "react-router-dom";
import {
  Apple,
  BookOpen,
  ChefHat,
  Play,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Banner } from "@/components/common/Banner";
import { SectionHeader } from "@/components/common/SectionHeader";
import { GridSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { RecipeGrid } from "@/components/recipe/RecipeGrid";
import { RecipeSearch } from "@/components/search/RecipeSearch";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { BANNERS, LOGO } from "@/lib/banners";

const FEATURES = [
  { icon: Users, title: "جامعه آشپزی", text: "به اشتراک‌گذاری تجربه‌ها" },
  { icon: ShoppingCart, title: "لیست خرید هوشمند", text: "مواد هر دستور یک‌جا" },
  { icon: Sparkles, title: "پیشنهاد هوشمند", text: "بر اساس مواد و سلیقه شما" },
  { icon: BookOpen, title: "دستور پخت‌های متنوع", text: "هزاران دستور آزمایش‌شده" },
];

const STATS = [
  { icon: Star, value: "۴.۸", label: "میانگین امتیاز کاربران" },
  { icon: ChefHat, value: "+۵۰,۰۰۰", label: "دست‌پخت ثبت‌شده" },
  { icon: Users, value: "+۱۰,۰۰۰", label: "کاربر فعال" },
  { icon: BookOpen, value: "+۵,۰۰۰", label: "دستور پخت متنوع" },
];

const STORES = [
  { icon: Play, label: "Google Play", sub: "دانلود از" },
  { icon: Apple, label: "App Store", sub: "دانلود از" },
];

export function LandingPage() {
  const popular = useAsync(() => api.getPopularRecipes(5), []);

  return (
    <div>
      <section className="border-b border-line bg-[#F4F7F2]">
        <div className="relative">
          <h1 className="sr-only">امروز چه غذایی درست کنم؟</h1>
          <img
            src={BANNERS.hero}
            alt="امروز چه غذایی درست کنم؟"
            className="h-auto w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-3 mx-auto w-[min(92%,40rem)] rounded-2xl border border-line bg-white/95 p-1.5 shadow-card sm:bottom-6">
            <RecipeSearch
              placeholder="مثلاً: پاستا، مرغ، غذای سریع…"
              submitLabel="جستجو"
              size="lg"
              inputClassName="border-0 bg-transparent shadow-none focus:ring-0"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-primary-light/40">
        <div className="container-page flex flex-col items-start gap-3 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold text-primary-dark">کمتر از ۳۰ ثانیه</p>
            <h2 className="mt-1 text-lg font-extrabold text-ink sm:text-xl">امشب چه بپزم؟</h2>
            <p className="mt-1 max-w-md text-sm leading-7 text-muted">
              سه ضربه، سه پیشنهاد شام. موادش را همان لحظه بفرست به لیست خرید.
            </p>
          </div>
          <Link to="/tonight">
            <Button size="lg">بگو چی بپزم</Button>
          </Link>
        </div>
      </section>

      <section aria-label="ویژگی‌ها" className="border-b border-line bg-surface">
        <ul className="container-page grid grid-cols-2 gap-y-8 py-8 sm:gap-y-10 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex flex-col items-center gap-2 border-line px-4 text-center lg:border-l lg:last:border-l-0"
            >
              <span className="grid size-12 place-items-center rounded-2xl text-primary">
                <f.icon className="size-8" strokeWidth={1.6} />
              </span>
              <h3 className="text-sm font-extrabold text-ink">{f.title}</h3>
              <p className="text-xs text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page py-12" aria-labelledby="popular-heading">
        <SectionHeader
          title="محبوب‌ترین دستور پخت‌ها"
          actionLabel="مشاهده همه"
          actionTo="/assistant"
        />
        <h2 id="popular-heading" className="sr-only">
          محبوب‌ترین دستور پخت‌ها
        </h2>
        {popular.loading ? (
          <GridSkeleton count={5} />
        ) : popular.error ? (
          <ErrorState description={popular.error} onRetry={popular.reload} />
        ) : (
          <RecipeGrid recipes={popular.data ?? []} columns="landing" />
        )}
      </section>

      <section className="container-page pb-12" aria-labelledby="community-heading">
        <h2 id="community-heading" className="sr-only">
          یک جامعه‌ی خوشمزه
        </h2>
        <Link to="/community" aria-label="عضویت در جامعه">
          <Banner
            src={BANNERS.community}
            alt="یک جامعه‌ی خوشمزه"
            ratio="auto"
            className="shadow-card transition-transform duration-300 hover:-translate-y-0.5"
          />
        </Link>
      </section>

      <section
        id="download"
        className="container-page pb-12"
        aria-labelledby="download-heading"
      >
        <div className="grid overflow-hidden rounded-3xl border border-line bg-canvas shadow-card lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <img src={LOGO.full} alt="Cookify" className="h-16 w-auto self-start sm:h-20" />
            <h2 id="download-heading" className="text-2xl font-extrabold text-ink sm:text-3xl">
              همیشه همراه شما
            </h2>
            <p className="max-w-sm text-sm leading-7 text-muted">
              اپلیکیشن Cookify را دانلود کنید و در هر زمان و مکان آشپزی کنید.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {STORES.map((store) => (
                <a
                  key={store.label}
                  href="#download"
                  aria-label={`${store.sub} ${store.label}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-white transition-colors hover:bg-ink/90"
                >
                  <store.icon className="size-5 shrink-0" />
                  <span className="flex flex-col text-right leading-tight">
                    <span className="text-[9px] text-white/60">{store.sub}</span>
                    <span className="text-sm font-bold">{store.label}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
          <img
            src={BANNERS.appDownload}
            alt="مواد تازه آشپزی"
            className="h-56 w-full object-cover lg:h-full"
          />
        </div>
      </section>

      <section className="container-page pb-12" aria-labelledby="categories-heading">
        <SectionHeader
          title="دسته‌بندی‌ها"
          subtitle="بر اساس سلیقه، فصل و سبک زندگی"
          actionLabel="مشاهده همه"
          actionTo="/categories"
        />
        <h2 id="categories-heading" className="sr-only">
          دسته‌بندی‌ها
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {BANNERS.categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories?tag=${category.id}`}
              aria-label={category.title}
              className="block"
            >
              <Banner
                src={category.src}
                alt={category.title}
                ratio="auto"
                className="shadow-card transition-transform duration-300 hover:-translate-y-0.5"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-12" aria-labelledby="shopping-heading">
        <Banner
          src={BANNERS.assistant}
          alt="لیست خرید هوشمند Cookify"
          className="shadow-card"
        />
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-6 text-center sm:flex-row sm:text-right">
          <div>
            <h2 id="shopping-heading" className="text-lg font-extrabold text-ink">
              لیست خرید هوشمند
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              مواد لازم هر دستور را با یک کلیک به لیست خریدت اضافه کن.
            </p>
          </div>
          <Link to="/shopping-list" className="shrink-0">
            <Button size="lg">
              <ShoppingCart className="size-5" />
              مشاهده لیست خرید
            </Button>
          </Link>
        </div>
      </section>

      <section className="container-page pb-14" aria-label="آمار">
        <ul className="grid grid-cols-2 gap-y-6 rounded-2xl border border-line bg-surface py-7 shadow-card lg:grid-cols-4">
          {STATS.map((s) => (
            <li
              key={s.label}
              className="flex flex-col items-center gap-1.5 border-line px-4 text-center lg:border-l lg:last:border-l-0"
            >
              <s.icon className="size-6 text-primary" strokeWidth={1.8} />
              <span className="text-2xl font-extrabold text-ink">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
