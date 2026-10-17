import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bell, Check, ChevronDown, MapPin, Menu } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { PRIMARY_NAV } from "@/components/layout/primaryNav";
import { Avatar } from "@/components/common/Avatar";
import { IconButton } from "@/components/common/IconButton";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/context/AuthContext";
import { RecipeSearch } from "@/components/search/RecipeSearch";
import { api } from "@/data/api";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AppNotification } from "@/data/types";

const AREAS = ["تهران، منطقه ۲", "تهران، منطقه ۱", "تهران، منطقه ۳", "کرج", "اصفهان"];

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user, isLoggedIn } = useAuth();
  const [notesOpen, setNotesOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [area, setArea] = useState(AREAS[0]);
  const [notes, setNotes] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotes([]);
      return;
    }
    api.listNotifications().then(setNotes).catch(() => setNotes([]));
  }, [isLoggedIn]);

  const unread = notes.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="container-app flex h-[68px] items-center gap-3">
        <IconButton
          label="منو"
          variant="soft"
          className="lg:hidden"
          onClick={onMenu}
        >
          <Menu className="size-5" />
        </IconButton>

        <Logo className="shrink-0" />

        <nav
          className="ms-2 hidden items-center gap-0.5 xl:flex"
          aria-label="ناوبری اصلی"
        >
          {PRIMARY_NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={"end" in l ? l.end : false}
              className={({ isActive }) =>
                cn(
                  "relative whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                  isActive ? "text-primary-dark" : "text-muted hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[14px] h-0.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <RecipeSearch className="relative mx-auto hidden max-w-md flex-1 lg:block xl:max-w-lg" />

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAreaOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-canvas 2xl:flex"
            aria-label="انتخاب موقعیت مکانی"
          >
            <MapPin className="size-4 text-primary" />
            {area}
            <ChevronDown className="size-3.5 text-muted" />
          </button>

          <div className="relative">
            <IconButton
              label="اعلان‌ها"
              variant="soft"
              className="relative"
              onClick={() => setNotesOpen((v) => !v)}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-danger" />
              )}
            </IconButton>
            {notesOpen && (
              <div className="absolute left-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-sm font-extrabold text-ink">اعلان‌ها</p>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-primary-dark"
                    onClick={() => {
                      setNotes((prev) => prev.map((n) => ({ ...n, unread: false })));
                      if (isLoggedIn) api.markAllNotificationsRead().catch(() => undefined);
                    }}
                  >
                    همه را خواندم
                  </button>
                </div>
                <ul>
                  {notes.map((note) => (
                    <li key={note.id}>
                      <Link
                        to={note.to}
                        onClick={() => {
                          setNotes((prev) =>
                            prev.map((n) =>
                              n.id === note.id ? { ...n, unread: false } : n,
                            ),
                          );
                          setNotesOpen(false);
                          if (isLoggedIn) api.markNotificationRead(note.id).catch(() => undefined);
                        }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-canvas"
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            note.unread ? "bg-primary" : "bg-line",
                          )}
                        />
                        <span>
                          <span className="block text-xs font-bold text-ink">
                            {note.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {note.body}
                          </span>
                          <span className="mt-1 block text-[10px] text-muted">
                            {relativeTime(note.at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  {notes.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-muted">
                      اعلانی نیست
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <Link to={isLoggedIn ? `/profile/${user.username}` : "/login"} aria-label="پروفایل">
            <span className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-canvas">
              <span className="hidden text-xs font-bold text-ink sm:block">
                {isLoggedIn ? user.name : "ورود"}
              </span>
              <Avatar name={user.name} src={user.avatar} size={34} />
            </span>
          </Link>
        </div>
      </div>

      <div className="container-app border-t border-line/70 py-2 xl:hidden">
        <nav className="flex gap-1 overflow-x-auto scrollbar-thin" aria-label="میانبر صفحات">
          {PRIMARY_NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={"end" in l ? l.end : false}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                  isActive
                    ? "bg-primary-light text-primary-dark"
                    : "bg-canvas text-muted hover:text-ink",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="container-app pb-3 lg:hidden">
        <RecipeSearch />
      </div>

      <Modal
        open={areaOpen}
        onClose={() => setAreaOpen(false)}
        title="موقعیت شما"
      >
        <ul className="space-y-1">
          {AREAS.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => {
                  setArea(item);
                  setAreaOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-canvas"
              >
                <span className="font-bold text-ink">{item}</span>
                {area === item && <Check className="size-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </header>
  );
}
