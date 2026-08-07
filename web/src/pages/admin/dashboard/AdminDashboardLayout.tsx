import { DashboardHub } from "@/shared/ui/dashboard";
import {
  ADMIN_DASHBOARD_BASE,
  ADMIN_DASHBOARD_TABS,
} from "@/features/dashboard/config/admin-dashboard-tabs";

export function AdminDashboardLayout() {
  return (
    <DashboardHub basePath={ADMIN_DASHBOARD_BASE} tabs={ADMIN_DASHBOARD_TABS} />
  );
}
