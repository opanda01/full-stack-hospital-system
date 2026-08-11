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
    <nav className="overflow-x-auto" aria-label="Alt modüller">
      <div className="flex min-w-max gap-0.5 pb-0">
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
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
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
  );
}
