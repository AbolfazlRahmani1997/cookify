import { ShoppingListPanel } from "@/components/shopping/ShoppingListPanel";

export function ShoppingSidebar() {
  return (
    <aside
      className="hidden w-72 shrink-0 xl:block"
      aria-label="لیست خرید"
    >
      <div className="sticky top-[76px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-card scrollbar-thin">
        <ShoppingListPanel variant="sidebar" />
      </div>
    </aside>
  );
}
