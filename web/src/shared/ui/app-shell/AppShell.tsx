import { useLocation } from "react-router-dom";
import type { CurrentUser } from "@/shared/auth";
import type { NavGroup, NavItem } from "@/shared/config/nav-items";
import type { NavDomain } from "@/shared/config/nav-domains";
import {
  flattenDomains,
  resolveNavDomain,
} from "@/shared/config/nav-domains";
import { InPanelShellContext } from "@/shared/ui/panel-shell-context";
import { PrimaryNav } from "./PrimaryNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type AppShellProps = {
  children: React.ReactNode;
  navGroups: NavGroup[];
  navDomains?: NavDomain[];
  currentUser: CurrentUser;
};

export function AppShell({
  children,
  navGroups,
  navDomains,
  currentUser,
}: AppShellProps) {
  const { pathname } = useLocation();
  const domainNav = Boolean(navDomains);
  const sidebarGroups = navDomains
    ? resolveNavDomain(pathname, navDomains).groups
    : navGroups;

  const navItems: NavItem[] = navDomains
    ? flattenDomains(navDomains)
    : navGroups.flatMap((g) => g.items);

  const activeDomain = navDomains
    ? resolveNavDomain(pathname, navDomains)
    : undefined;

  return (
    <InPanelShellContext.Provider value={true}>
      <div
        className="flex min-h-screen flex-col"
        style={{ background: "var(--app-bg)" }}
      >
        <header
          className="sticky top-0 z-20 shrink-0 border-b corporate-panel shadow-sm"
          style={{
            background: "var(--panel-bg)",
            borderColor:
              "color-mix(in srgb, var(--text-secondary) 12%, transparent)",
          }}
        >
          <div className="px-3 py-2.5 sm:px-4">
            <Topbar
              navItems={navItems}
              currentUser={currentUser}
              domainLabel={activeDomain?.label}
              showBrand={domainNav}
            />
          </div>
          {navDomains ? (
            <div className="border-t px-3 sm:px-4"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--text-secondary) 10%, transparent)",
              }}
            >
              <PrimaryNav domains={navDomains} />
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 gap-2 p-2 sm:gap-3 sm:p-3">
          <Sidebar
            navGroups={sidebarGroups}
            compact={domainNav}
            showBrand={!domainNav}
          />
          <main
            className="min-w-0 flex-1 overflow-y-auto rounded-xl px-3 py-3 sm:px-5 sm:py-4 corporate-panel"
            style={{ background: "var(--panel-bg)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </InPanelShellContext.Provider>
  );
}
