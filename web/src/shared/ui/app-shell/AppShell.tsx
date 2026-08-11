import { useLocation } from "react-router-dom";
import type { CurrentUser } from "@/shared/auth";
import type { NavItem } from "@/shared/config/nav-items";
import type { NavDomain } from "@/shared/config/nav-domains";
import {
  flattenDomains,
  resolveNavDomain,
} from "@/shared/config/nav-domains";
import { InPanelShellContext } from "@/shared/ui/panel-shell-context";
import { PrimaryNav } from "./PrimaryNav";
import { SecondaryNav } from "./SecondaryNav";
import { Topbar } from "./Topbar";

export type AppShellProps = {
  children: React.ReactNode;
  navDomains: NavDomain[];
  currentUser: CurrentUser;
};

export function AppShell({
  children,
  navDomains,
  currentUser,
}: AppShellProps) {
  const { pathname } = useLocation();

  if (!navDomains?.length) {
    throw new Error("AppShell: navDomains gerekli (sidebar kaldırıldı).");
  }

  const activeDomain = resolveNavDomain(pathname, navDomains);
  const navItems: NavItem[] = flattenDomains(navDomains);
  const showSecondaryNav = activeDomain.id !== "gosterge";

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
              domainLabel={activeDomain.label}
              showBrand
            />
          </div>
          <div
            className="border-t px-3 sm:px-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--text-secondary) 10%, transparent)",
            }}
          >
            <PrimaryNav domains={navDomains} />
          </div>
          {showSecondaryNav ? (
            <div
              className="border-t px-3 sm:px-4"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--text-secondary) 10%, transparent)",
              }}
            >
              <SecondaryNav groups={activeDomain.groups} />
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 p-2 sm:p-3">
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
