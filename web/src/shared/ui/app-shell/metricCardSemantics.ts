import type { MetricCardRenk } from "./MetricCard";
import type { DashboardEsik } from "@/features/dashboard/config/dashboardEsikleri";

/** Envanter / kapasite sayıları — nötr kart */
export function renkEnvanter(): MetricCardRenk {
  return "notr";
}

/** Kuyruk sayacı: sıfırda success, uyarı/kritik eşiğe göre yükselir */
export function renkKuyrukSayaci(
  count: number,
  yukleniyor = false,
  esik?: DashboardEsik,
): MetricCardRenk {
  if (yukleniyor) return "notr";
  if (count === 0) return "success";
  if (esik) return renkKritik(count, esik);
  return "warning";
}

/** Eşik tabanlı durum rengi */
export function renkKritik(count: number, esik: DashboardEsik): MetricCardRenk {
  if (count >= esik.kritik) return "kritik";
  if (count >= esik.uyari) return "warning";
  if (count === 0) return "success";
  return "notr";
}

/** Navigasyon / keşif kartları */
export function renkNavigasyon(): MetricCardRenk {
  return "accent";
}

export function sayisalBosMu(value: string | number): boolean {
  return typeof value === "number" && value === 0;
}
