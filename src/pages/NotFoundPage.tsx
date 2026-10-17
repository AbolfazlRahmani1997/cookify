import { Link } from "react-router-dom";
import { Compass, Home, SearchX } from "lucide-react";
import { Button } from "@/components/common/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-primary-light text-primary-dark">
        <SearchX className="size-10" />
      </span>
      <p className="mt-6 text-5xl font-extrabold text-ink">۴۰۴</p>
      <h1 className="mt-2 text-xl font-extrabold text-ink">
        این صفحه پیدا نشد
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
        ممکن است آدرس اشتباه باشد یا این صفحه حذف شده باشد. بیا به آشپزخانه
        برگردیم!
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/">
          <Button>
            <Home className="size-4" />
            صفحه اصلی
          </Button>
        </Link>
        <Link to="/assistant">
          <Button variant="secondary">
            <Compass className="size-4" />
            پیشنهاد غذا
          </Button>
        </Link>
      </div>
    </div>
  );
}
