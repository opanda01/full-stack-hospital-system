/** Admin dashboard KPI eşikleri — tek noktadan ayarlanabilir. */
export const DASHBOARD_ESIKLERI = {
  sikayetBekleyen: { uyari: 1, kritik: 3 },
  randevuBekleyen: { uyari: 5, kritik: 15 },
  temizlikAcik: { uyari: 3, kritik: 8 },
} as const;

export type DashboardEsik = (typeof DASHBOARD_ESIKLERI)[keyof typeof DASHBOARD_ESIKLERI];
