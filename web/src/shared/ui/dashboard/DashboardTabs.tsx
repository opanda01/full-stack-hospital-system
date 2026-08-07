import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

export type DashboardTabDef = {
  id: string;
  label: string;
  path: string;
};

type DashboardTabsProps = {
  tabs: DashboardTabDef[];
  basePath: string;
  ariaLabel?: string;
};

function isTabActive(pathname: string, tabPath: string, basePath: string) {
  if (tabPath === `${basePath}/ozet` || tabPath === basePath) {
    return pathname === basePath || pathname === `${basePath}/ozet`;
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

export function DashboardTabs({
  tabs,
  basePath,
  ariaLabel = "Gösterge paneli sekmeleri",
}: DashboardTabsProps) {
  const { pathname } = useLocation();

  return (
    <div
      className="-mx-1 overflow-x-auto px-1 pb-1"
      style={{
        borderBottom:
          "1px solid color-mix(in srgb, var(--text-secondary) 15%, transparent)",
      }}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex min-w-max gap-1"
      >
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.path, basePath);
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              role="tab"
              aria-selected={active}
              className={cn(
                "rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "text-[color:var(--text-secondary)] hover:bg-[color:var(--panel-inset-bg)] hover:text-[color:var(--text-primary)]",
              )}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
