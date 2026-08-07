import { DashboardHub } from "@/shared/ui/dashboard";
import { bashekimDashboardTabs } from "@/features/dashboard/config/yonetim-dashboard-tabs";

export function BashekimDashboardLayout() {
  return (
    <DashboardHub
      basePath="/bashekim"
      tabs={bashekimDashboardTabs("/bashekim")}
    />
  );
}
