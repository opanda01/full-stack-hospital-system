import type { MetricCardRenk } from "./MetricCard";

/** Envanter / kapasite sayıları — nötr kart */
export function renkEnvanter(): MetricCardRenk {
  return "notr";
}

/** Kuyruk veya aksiyon gerektiren sayaç: sıfırda olumlu (success), pozitifte uyarı */
export function renkKuyrukSayaci(count: number, yukleniyor = false): MetricCardRenk {
  if (yukleniyor) return "notr";
  return count > 0 ? "warning" : "success";
}

/** Navigasyon / keşif kartları */
export function renkNavigasyon(): MetricCardRenk {
  return "accent";
}

export function sayisalBosMu(value: string | number): boolean {
  return typeof value === "number" && value === 0;
}
