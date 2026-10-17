import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex w-full gap-1 overflow-x-auto rounded-2xl bg-primary-light/70 p-1.5",
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={active === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
            active === item.id
              ? "bg-primary text-white shadow-soft"
              : "text-primary-dark/70 hover:text-primary-dark",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
