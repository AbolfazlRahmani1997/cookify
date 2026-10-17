import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Heart,
  LogIn,
  Menu,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/common/Button";
import { IconButton } from "@/components/common/IconButton";
import { useShoppingList } from "@/context/ShoppingListContext";
import { useSaved } from "@/context/SavedContext";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { RecipeSearch } from "@/components/search/RecipeSearch";

const NAV = [
  { to: "/", label: "صفحه اصلی", icon: UtensilsCrossed, end: true },
  { to: "/assistant", label: "پیشنهاد غذا", icon: Sparkles },
  { to: "/community", label: "جامعه آشپزی", icon: Users },
  { to: "/shopping-list", label: "لیست خرید", icon: ShoppingCart },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useShoppingList();
  const { savedIds } = useSaved();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "border-line bg-surface/90 backdrop-blur-md"
          : "border-transparent bg-surface",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="ناوبری اصلی"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                  isActive
                    ? "text-primary-dark"
                    : "text-muted hover:bg-canvas hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <RecipeSearch
            className="relative hidden w-64 xl:block"
            placeholder="جستجوی غذا…"
          />

          <Link
            to="/community"
            className="relative hidden sm:inline-flex"
            aria-label="علاقه‌مندی‌ها"
          >
            <IconButton label="علاقه‌مندی‌ها" variant="soft" className="size-10">
              <Heart className="size-5" />
            </IconButton>
            {savedIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">
                {formatNumber(savedIds.length)}
              </span>
            )}
          </Link>

          <Link
            to="/shopping-list"
            className="relative"
            aria-label="لیست خرید"
          >
            <IconButton label="لیست خرید" variant="soft" className="size-10">
              <ShoppingCart className="size-5" />
            </IconButton>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                {formatNumber(count)}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" className="text-ink">
              <LogIn className="size-4" />
              ورود
            </Button>
            <Button size="sm">
              <UserPlus className="size-4" />
              ثبت‌نام
            </Button>
          </div>

          <IconButton
            label="منو"
            variant="soft"
            className="lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </IconButton>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-line bg-surface px-4 pb-4 pt-2 lg:hidden"
          aria-label="ناوبری موبایل"
        >
          <ul className="grid gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold",
                      isActive
                        ? "bg-primary-light text-primary-dark"
                        : "text-muted hover:bg-canvas",
                    )
                  }
                >
                  <item.icon className="size-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" fullWidth size="sm">
              <LogIn className="size-4" />
              ورود
            </Button>
            <Button fullWidth size="sm">
              <UserPlus className="size-4" />
              ثبت‌نام
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
