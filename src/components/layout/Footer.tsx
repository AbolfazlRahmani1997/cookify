import { Link } from "react-router-dom";
import { Heart, Instagram, Mail, Send, Twitter } from "lucide-react";
import { LogoLockup } from "@/components/layout/Logo";
import { Button } from "@/components/common/Button";

const QUICK_LINKS = [
  { to: "/assistant", label: "دستور پخت‌ها" },
  { to: "/community", label: "جامعه آشپزی" },
  { to: "/#download", label: "اپلیکیشن" },
  { to: "/about", label: "درباره ما" },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <LogoLockup className="max-w-[190px]" />
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold text-ink">
            با ما در ارتباط باشید
          </h3>
          <p className="mb-3 text-sm leading-6 text-muted">
            جدیدترین دستور پخت‌ها و پیشنهادها را دریافت کنید.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => e.preventDefault()}
            aria-label="عضویت در خبرنامه"
          >
            <input
              type="email"
              required
              placeholder="ایمیل شما"
              aria-label="ایمیل"
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 text-sm placeholder:text-muted/70 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" className="shrink-0">
              عضویت
            </Button>
          </form>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold text-ink">راه‌های ارتباطی</h3>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <Link
                to="/contact"
                className="flex items-center gap-2 hover:text-primary-dark"
              >
                <Mail className="size-4 text-primary" />
                support@cookify.ir
              </Link>
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <a
              href="#"
              aria-label="اینستاگرام"
              className="grid size-9 place-items-center rounded-xl bg-canvas text-muted transition-colors hover:bg-primary-light hover:text-primary-dark"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="#"
              aria-label="توییتر"
              className="grid size-9 place-items-center rounded-xl bg-canvas text-muted transition-colors hover:bg-primary-light hover:text-primary-dark"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="#"
              aria-label="تلگرام"
              className="grid size-9 place-items-center rounded-xl bg-canvas text-muted transition-colors hover:bg-primary-light hover:text-primary-dark"
            >
              <Send className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold text-ink">دسترسی سریع</h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-muted transition-colors hover:text-primary-dark"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>© ۲۰۲۶ همه حقوق محفوظ است.</p>
          <p className="flex items-center gap-1.5">
            غذای خوب، حال خوب
            <Heart className="size-3.5 fill-danger text-danger" />
          </p>
        </div>
      </div>
    </footer>
  );
}
