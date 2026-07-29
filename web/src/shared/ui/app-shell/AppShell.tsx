import type { CurrentUser } from "@/shared/auth";
import type { NavGroup, NavItem } from "@/shared/config/nav-items";
import { InPanelShellContext } from "@/shared/ui/panel-shell-context";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type AppShellProps = {
  children: React.ReactNode;
  navGroups: NavGroup[];
  currentUser: CurrentUser;
};

export function AppShell({ children, navGroups, currentUser }: AppShellProps) {
  const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
  return (
    <InPanelShellContext.Provider value={true}>
      <div
        className="box-border flex min-h-screen gap-3 p-3 sm:gap-4 sm:p-4"
        style={{ background: "var(--app-bg)" }}
      >
        <Sidebar navGroups={navGroups} />
        <div
          className="flex min-h-[calc(100vh-24px)] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl px-4 py-4 sm:min-h-[calc(100vh-32px)] sm:px-6 sm:py-5 corporate-panel"
          style={{ background: "var(--panel-bg)" }}
        >
          <Topbar navItems={navItems} currentUser={currentUser} />
          <main className="mt-4 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </InPanelShellContext.Provider>
  );
}
