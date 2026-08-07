import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/shared/auth";
import { DashboardTabs, type DashboardTabDef } from "./DashboardTabs";

type DashboardHubProps = {
  basePath: string;
  tabs: DashboardTabDef[];
  subtitle?: string;
  /** Route tab içeriği için Outlet; tek sayfa kullanımında children */
  children?: ReactNode;
};

export function DashboardHub({
  basePath,
  tabs,
  subtitle,
  children,
}: DashboardHubProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const ad = currentUser?.ad ?? "Demo";
  const soyad = currentUser?.soyad ?? "Kullanıcı";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title text-lg sm:text-xl">
          Hoş geldiniz, {ad} {soyad}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      <DashboardTabs tabs={tabs} basePath={basePath} />

      <div role="tabpanel" className="pt-1">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}
