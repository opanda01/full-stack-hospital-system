import type { CurrentUser } from "@/shared/auth";
import type { NavItem } from "@/shared/config/nav-items";
import { InPanelShellContext } from "@/shared/ui/panel-shell-context";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type AppShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  currentUser: CurrentUser;
};

export function AppShell({ children, navItems, currentUser }: AppShellProps) {
  return (
    <InPanelShellContext.Provider value={true}>
      <div
        className="box-border flex min-h-screen gap-[14px] p-[14px]"
        style={{ background: "var(--app-bg)" }}
      >
        <Sidebar navItems={navItems} />
        <div
          className="flex min-h-[calc(100vh-28px)] min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] px-6 py-5"
          style={{ background: "var(--panel-bg)" }}
        >
          <Topbar navItems={navItems} currentUser={currentUser} />
          <main className="mt-4 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </InPanelShellContext.Provider>
  );
}
