import { NavLink } from "react-router-dom";
import type { NavGroup } from "@/shared/config/nav-items";
import { cn } from "@/shared/lib/utils";

type SecondaryNavProps = {
  groups: NavGroup[];
};

export function SecondaryNav({ groups }: SecondaryNavProps) {
  const items = groups.flatMap((g) => g.items);
  if (items.length <= 1) return null;

  return (
    <div
      className="-mx-1 overflow-x-auto px-1 pb-1"
      style={{
        borderBottom:
          "1px solid color-mix(in srgb, var(--text-secondary) 15%, transparent)",
      }}
    >
      <nav aria-label="Alt modüller">
        <div className="flex min-w-max gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const end = item.path.split("/").length <= 2;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                      : "text-[color:var(--text-secondary)] hover:bg-[color:var(--panel-inset-bg)] hover:text-[color:var(--text-primary)]",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
