import { NavLink } from "react-router-dom";
import { Activity } from "lucide-react";
import type { NavGroup } from "@/shared/config/nav-items";
import { flattenNav } from "@/shared/config/nav-items";
import { cn } from "@/shared/lib/utils";

type SidebarProps = {
  navGroups: NavGroup[];
};

export function Sidebar({ navGroups }: SidebarProps) {
  const navItems = flattenNav(navGroups);

  return (
    <aside
      className="sidebar-panel flex h-[calc(100vh-32px)] w-[300px] shrink-0 flex-col overflow-hidden rounded-[32px] px-5 py-5 text-[color:var(--text-primary)]"
      style={{
        background: "var(--panel-bg)",
        border: "1px solid color-mix(in srgb, var(--text-secondary) 22%, transparent)",
        boxShadow:
          "0 2px 4px color-mix(in srgb, #000 5%, transparent), 0 18px 40px color-mix(in srgb, #000 10%, transparent)",
      }}
    >
      <div className="mb-5 px-1">
        <div
          className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[18px]"
          style={{
            background: "var(--nav-active-bg)",
            color: "var(--nav-active-text)",
          }}
        >
          <Activity className="h-5 w-5" stroke="currentColor" />
        </div>
        <p
          className="text-xs font-semibold leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          Çanakkale Mehmet Akif Ersoy Devlet Hastanesi
        </p>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split("/").length <= 2}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-sm transition-colors [&_svg]:shrink-0 [&_svg]:text-current",
                  isActive
                    ? "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]"
                    : "bg-transparent font-normal text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]",
                )
              }
            >
              <Icon className="h-4 w-4" stroke="currentColor" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
