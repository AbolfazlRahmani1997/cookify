import { NavLink } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useShoppingList } from "@/context/ShoppingListContext";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useProfileHref } from "@/hooks/useProfileHref";

const BASE = [
  { to: "/", label: "خانه", icon: Home, end: true },
  { to: "/tonight", label: "امشب", icon: Sparkles },
  { to: "/shopping-list", label: "خرید", icon: ShoppingCart, badge: true },
  { to: "/community", label: "جامعه", icon: Users },
];

export function MobileNav() {
  const { count } = useShoppingList();
  const profileHref = useProfileHref();
  const items = [
    ...BASE,
    { to: profileHref, label: "پروفایل", icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
      aria-label="ناوبری پایین"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition duration-200",
                  isActive ? "text-primary" : "text-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("relative grid h-8 min-w-12 place-items-center rounded-full transition duration-200", isActive && "bg-primary-light")}>
                    <item.icon className="size-5" />
                    {item.badge && count > 0 && (
                      <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] text-white">
                        {formatNumber(count)}
                      </span>
                    )}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
