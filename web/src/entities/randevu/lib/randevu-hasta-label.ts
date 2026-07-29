import type { Randevu } from "../model/types";

export function randevuHastaAdi(
  r: Pick<Randevu, "hasta_id" | "hasta_ad_soyad">,
): string {
  const ad = r.hasta_ad_soyad?.trim();
  if (ad) return ad;
  return "Hasta";
}
