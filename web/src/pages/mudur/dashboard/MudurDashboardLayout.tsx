import { YonetimDashboardLayout } from "@/pages/ortak/yonetim-dashboard/YonetimDashboardLayout";
import { mudurDashboardTabs } from "@/features/dashboard/config/yonetim-dashboard-tabs";

export function MudurDashboardLayout() {
  return (
    <YonetimDashboardLayout basePath="/mudur" tabs={mudurDashboardTabs("/mudur")} />
  );
}
