import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogIn, Menu, Search, UserPlus, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { PRIMARY_NAV } from "@/components/layout/primaryNav";
import { Button } from "@/components/common/Button";
import { IconButton } from "@/components/common/IconButton";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/context/AuthContext";
import { RecipeSearch } from "@/components/search/RecipeSearch";
import { cn } from "@/lib/cn";

const EXTRA = [
  { to: "/about", label: "درباره ما" },
  { to: "/contact", label: "تماس با ما" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const links = [...PRIMARY_NAV, ...EXTRA];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="container-page flex h-[68px] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end={"end" in l ? l.end : false}
              className={({ isActive }) =>
                cn(
                  "relative rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                  isActive ? "text-primary-dark" : "text-muted hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <IconButton label="جستجو" variant="soft" onClick={() => navigate("/assistant")}>
            <Search className="size-5" />
          </IconButton>
          {isLoggedIn ? (
            <Link to={`/profile/${user.username}`} aria-label="پروفایل">
              <Avatar name={user.name} src={user.avatar} size={34} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="text-ink">
                  <LogIn className="size-4" />
                  ورود
                </Button>
              </Link>
              <Link to="/signup" className="hidden sm:inline-flex">
                <Button size="sm">
                  <UserPlus className="size-4" />
                  ثبت‌نام
                </Button>
              </Link>
            </>
          )}
          <IconButton
            label="منو"
            variant="soft"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-4 pb-4 pt-3 lg:hidden">
          <div className="mb-3">
            <RecipeSearch placeholder="دنبال چه غذایی هستی؟" />
          </div>
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-bold text-muted hover:bg-canvas"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Link to="/login" className="flex-1">
              <Button variant="secondary" fullWidth size="sm">
                <LogIn className="size-4" />
                ورود
              </Button>
            </Link>
            <Link to="/signup" className="flex-1">
              <Button fullWidth size="sm">
                <UserPlus className="size-4" />
                ثبت‌نام
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
