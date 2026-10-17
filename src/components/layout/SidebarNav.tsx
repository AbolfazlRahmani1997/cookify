import { useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpen,
  Grid2x2,
  Heart,
  Home,
  LayoutGrid,
  MessageCircle,
  Plus,
  Shield,
  ShoppingCart,
  Sparkles,
  User,
} from "lucide-react";
import { CameraIllustration } from "@/components/illustrations";
import { cn } from "@/lib/cn";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useAuth } from "@/context/AuthContext";
import { useProfileHref } from "@/hooks/useProfileHref";
import { formatNumber } from "@/lib/format";
import { canPublishRecipes } from "@/lib/access";

const NAV = [
  { to: "/", label: "صفحه اصلی", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/tonight",
    label: "امشب چه بپزم؟",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/tonight"),
  },
  {
    to: "/assistant",
    label: "دستور پخت‌ها",
    icon: BookOpen,
    match: (p: string) => p.startsWith("/assistant") || p.startsWith("/recipes"),
  },
  {
    to: "/shopping-list",
    label: "لیست خرید",
    icon: ShoppingCart,
    match: (p: string) => p.startsWith("/shopping-list"),
    badge: true,
  },
  {
    to: "/community",
    label: "دست‌پخت‌های شما",
    icon: Grid2x2,
    match: (p: string) => p === "/community" || p.startsWith("/community/"),
  },
  {
    to: "/categories",
    label: "دسته‌بندی‌ها",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/categories"),
  },
  {
    to: "/favorites",
    label: "علاقه‌مندی‌ها",
    icon: Heart,
    match: (p: string) => p.startsWith("/favorites"),
  },
  {
    to: "/messages",
    label: "پیام‌ها",
    icon: MessageCircle,
    match: (p: string) => p.startsWith("/messages"),
  },
];

export function SidebarNav() {
  const { pathname } = useLocation();
  const inMessages = pathname.startsWith("/messages");
  const [scrolling, setScrolling] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const scrollTimer = useRef<number | null>(null);
  const scrollingRef = useRef(false);
  const { count } = useShoppingList();
  const profileHref = useProfileHref();
  const { user } = useAuth();
  const publisher = canPublishRecipes(user);
  const items = [
    ...NAV,
    {
      to: profileHref,
      label: "پروفایل",
      icon: User,
      match: (p: string) => p.startsWith("/profile") || p === "/login",
    },
  ];

  return (
    <aside
      className={cn(
        "relative hidden w-56 shrink-0 lg:block",
        inMessages && "min-h-0 self-stretch overflow-hidden",
      )}
      aria-label="ناوبری اصلی"
    >
      <div
        onScroll={(event) => {
          const el = event.currentTarget;
          const max = el.scrollHeight - el.clientHeight;
          setScrollRatio(max > 0 ? el.scrollTop / max : 0);
          if (!scrollingRef.current) navigator.vibrate?.(12);
          scrollingRef.current = true;
          setScrolling(true);
          if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
          scrollTimer.current = window.setTimeout(() => {
            scrollingRef.current = false;
            setScrolling(false);
          }, 500);
        }}
        className={cn("space-y-4", inMessages ? "no-scrollbar h-full overflow-y-auto overscroll-contain pb-4" : "sticky top-[76px]")}
      >
        <NavLink
          to="/community/create"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="size-4" />
          ثبت دست‌پخت
        </NavLink>
        {user?.level === "staff" && (
          <NavLink
            to="/admin"
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-2.5 text-sm font-bold text-ink"
          >
            <Shield className="size-4" />
            بک‌آفیس
          </NavLink>
        )}
        {publisher && (
          <NavLink
            to="/recipes/new"
            className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary-light py-2.5 text-sm font-bold text-primary-dark transition-colors hover:bg-primary hover:text-white"
          >
            <Plus className="size-4" />
            ثبت دستور غذا
          </NavLink>
        )}

        <nav className="rounded-2xl border border-line bg-surface p-2">
          <ul className="space-y-0.5">
            {items.map((item, i) => {
              const active = item.match(pathname);
              return (
                <li key={`${item.label}-${i}`}>
                  <NavLink
                    to={item.to}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-bold transition duration-200",
                      active
                        ? "bg-primary-light text-primary-dark"
                        : "text-muted hover:bg-canvas hover:text-ink",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon className="size-[18px]" />
                      {item.label}
                    </span>
                    {item.badge && count > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {formatNumber(count)}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {pathname.startsWith("/community") ? (
          <div className="rounded-2xl border border-line bg-primary-light/50 p-3 text-center">
            <CameraIllustration className="mx-auto h-24 w-24" />
            <h3 className="mt-1 text-sm font-extrabold text-ink">
              دست‌پختت رو به اشتراک بذار
            </h3>
            <p className="mt-1 text-[11px] leading-5 text-muted">
              عکس بگیر، تجربه‌ات رو بنویس و دیگران رو با خلاقیتت شگفت‌زده کن!
            </p>
            <NavLink
              to="/community/create"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <Plus className="size-4" />
              ثبت نتیجه آشپزی
            </NavLink>
          </div>
        ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-primary-light/50 p-3 text-center">
          <h3 className="mt-1 text-sm font-extrabold text-ink">امشب چه بپزم؟</h3>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            سه سؤال کوتاه، سه پیشنهاد شام — بعد مواد را به لیست خرید بفرست.
          </p>
          <NavLink
            to="/tonight"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
          >
            <Sparkles className="size-4" />
            شروع کن
          </NavLink>
        </div>
        )}
      </div>
      {inMessages && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-4 size-20 rounded-full bg-transparent shadow-[0_0_18px_8px_rgba(16,185,129,0.45)] transition-opacity duration-300",
            scrolling ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </aside>
  );
}
