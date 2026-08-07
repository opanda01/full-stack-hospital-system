import type { DashboardTabDef } from "@/shared/ui/dashboard";

const ROOT = "/admin";

export const ADMIN_DASHBOARD_TABS: DashboardTabDef[] = [
  { id: "ozet", label: "Özet", path: `${ROOT}/ozet` },
  { id: "bekleyenler", label: "Bekleyenler", path: `${ROOT}/bekleyenler` },
  { id: "operasyon", label: "Operasyon", path: `${ROOT}/operasyon` },
  { id: "ik", label: "İnsan kaynakları", path: `${ROOT}/insan-kaynaklari` },
  { id: "sistem", label: "Sistem", path: `${ROOT}/sistem` },
];

export const ADMIN_DASHBOARD_BASE = ROOT;
