import type { DashboardTabDef } from "@/shared/ui/dashboard";

export function mudurDashboardTabs(root: "/mudur"): DashboardTabDef[] {
  return [
    { id: "ozet", label: "Özet", path: `${root}/ozet` },
    { id: "bekleyenler", label: "Bekleyenler", path: `${root}/bekleyenler` },
    { id: "operasyon", label: "Operasyon", path: `${root}/operasyon` },
  ];
}

export function bashekimDashboardTabs(root: "/bashekim"): DashboardTabDef[] {
  return [
    { id: "ozet", label: "Özet", path: `${root}/ozet` },
    { id: "bekleyenler", label: "Bekleyenler", path: `${root}/bekleyenler` },
    { id: "operasyon", label: "Operasyon", path: `${root}/operasyon` },
    { id: "kurumsal", label: "Kurumsal", path: `${root}/kurumsal` },
  ];
}
