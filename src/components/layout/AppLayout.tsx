import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  Grid2x2,
  Heart,
  Home,
  LayoutGrid,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { ShoppingSidebar } from "@/components/shopping/ShoppingSidebar";
import { ToastViewport } from "@/components/common/ToastViewport";
import { CookDock } from "@/components/recipe/CookDock";
import { useProfileHref } from "@/hooks/useProfileHref";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { canPublishRecipes } from "@/lib/access";

const MOBILE_NAV = [
  { to: "/", label: "صفحه اصلی", icon: Home },
  { to: "/tonight", label: "امشب چه بپزم؟", icon: Sparkles },
  { to: "/assistant", label: "دستور پخت‌ها", icon: BookOpen },
  { to: "/shopping-list", label: "لیست خرید", icon: ShoppingCart },
  { to: "/community", label: "دست‌پخت‌های شما", icon: Grid2x2 },
  { to: "/categories", label: "دسته‌بندی‌ها", icon: LayoutGrid },
  { to: "/favorites", label: "علاقه‌مندی‌ها", icon: Heart },
  { to: "/messages", label: "پیام‌ها", icon: MessageCircle },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function AppLayout() {
  const { pathname } = useLocation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileHref = useProfileHref();
  const { user } = useAuth();
  const menuItems = [...MOBILE_NAV, { to: profileHref, label: "پروفایل", icon: User }];
  const isHome = pathname === "/";
  const isMessages = pathname.startsWith("/messages");
  const showShopping =
    !isHome &&
    (pathname.startsWith("/assistant") ||
      pathname.startsWith("/tonight") ||
      pathname.startsWith("/recipes") ||
      pathname.startsWith("/categories"));

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className={cn("flex min-h-screen flex-col bg-canvas", isMessages && "h-dvh overflow-hidden")}>
      <ScrollToTop />
      <TopBar onMenu={() => setMenuOpen(true)} />

      {isHome ? (
        <main key={location.pathname} className="page-in w-full flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      ) : (
        <div className={cn("container-app flex w-full flex-1 items-start gap-5 py-5 pb-24 lg:pb-8", isMessages && "min-h-0 items-stretch overflow-hidden py-0 pb-0 max-lg:px-0 lg:py-4")}>
          <SidebarNav />
          <main key={location.pathname} className={cn("page-in min-w-0 flex-1", isMessages && "flex min-h-0 flex-col overflow-hidden")}>
            <Outlet />
          </main>
          {showShopping && <ShoppingSidebar />}
        </div>
      )}

      {!isMessages && <Footer />}
      <CookDock />
      <MobileNav />
      <ToastViewport />

      {menuOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            role="presentation"
          />
          <nav
            className="absolute inset-y-0 right-0 flex w-72 flex-col overflow-y-auto bg-surface p-4 shadow-pop scrollbar-thin"
            aria-label="ناوبری موبایل"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-extrabold text-ink">منو</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="بستن منو"
                className="rounded-lg p-1.5 text-muted hover:bg-canvas"
              >
                <X className="size-5" />
              </button>
            </div>

            <NavLink
              to="/community/create"
              className="mb-3 block rounded-xl bg-primary py-3 text-center text-sm font-bold text-white"
            >
              + ثبت دست‌پخت
            </NavLink>
            {canPublishRecipes(user) && (
              <NavLink
                to="/recipes/new"
                className="mb-3 block rounded-xl border border-primary bg-primary-light py-3 text-center text-sm font-bold text-primary-dark"
              >
                + ثبت دستور غذا
              </NavLink>
            )}

            <ul className="space-y-0.5">
              {menuItems.map((item, i) => (
                <li key={`${item.label}-${i}`}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold",
                        isActive
                          ? "bg-primary-light text-primary-dark"
                          : "text-muted",
                      )
                    }
                  >
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl bg-primary-light/50 p-3 text-center">
              <p className="text-xs font-bold text-ink">امشب چه بپزم؟</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                سه سؤال، سه پیشنهاد شام
              </p>
              <NavLink
                to="/tonight"
                className="mt-3 block rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
              >
                شروع کن
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
