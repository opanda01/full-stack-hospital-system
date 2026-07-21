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
      className="sidebar-panel flex h-[calc(100vh-28px)] w-[224px] shrink-0 flex-col overflow-hidden rounded-[22px] px-4 py-[1.1rem] text-[color:var(--text-primary)]"
      style={{ background: "var(--panel-inset-bg)" }}
    >
      <div className="mb-4 px-1">
        <div
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl"
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

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split("/").length <= 2}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-2xl px-[14px] py-[10px] text-sm transition-colors [&_svg]:shrink-0 [&_svg]:text-current",
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
