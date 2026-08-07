/** @deprecated Use MudurDashboardLayout + tab routes */
import { YonetimDashboardOzetTab } from "@/pages/ortak/yonetim-dashboard/tabs/OzetTab";

export function MudurDashboardPage() {
  return <YonetimDashboardOzetTab root="/mudur" />;
}

export { MudurDashboardLayout } from "./MudurDashboardLayout";
