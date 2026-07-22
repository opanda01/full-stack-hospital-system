import type { CurrentUser } from "@/shared/auth";
import type { NavGroup, NavItem } from "@/shared/config/nav-items";
import { flattenNav } from "@/shared/config/nav-items";
import { InPanelShellContext } from "@/shared/ui/panel-shell-context";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type AppShellProps = {
  children: React.ReactNode;
  navGroups: NavGroup[];
  currentUser: CurrentUser;
};

export function AppShell({ children, navGroups, currentUser }: AppShellProps) {
  const navItems: NavItem[] = flattenNav(navGroups);
  return (
    <InPanelShellContext.Provider value={true}>
      <div
        className="box-border flex min-h-screen gap-4 p-4"
        style={{ background: "var(--app-bg)" }}
      >
        <Sidebar navGroups={navGroups} />
        <div
          className="flex min-h-[calc(100vh-32px)] min-w-0 flex-1 flex-col overflow-hidden rounded-[32px] px-6 py-5"
          style={{
            background: "var(--panel-bg)",
            border:
              "1px solid color-mix(in srgb, var(--text-secondary) 22%, transparent)",
            boxShadow:
              "0 2px 4px color-mix(in srgb, #000 5%, transparent), 0 18px 40px color-mix(in srgb, #000 10%, transparent)",
          }}
        >
          <Topbar navItems={navItems} currentUser={currentUser} />
          <main className="mt-4 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </InPanelShellContext.Provider>
  );
}
