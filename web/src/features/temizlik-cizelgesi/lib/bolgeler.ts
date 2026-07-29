/** Varsayılan temizlik bölgeleri — görevlerden gelenlerle birleştirilir. */
export const VARSAYILAN_TEMIZLIK_BOLGELERI = [
  "Poliklinik koridorları",
  "Acil servis",
  "Dahili servis",
  "Cerrahi servis",
  "Kadın doğum servisi",
  "Yoğun bakım ön alan",
  "Radyoloji bekleme",
  "Laboratuvar",
  "Eczane önü",
  "Ana giriş ve hol",
  "Yemekhane",
  "Ameliyathane koridoru",
] as const;

export function birlestirBolgeler(
  mevcut: string[],
  ek: string[],
): string[] {
  const set = new Set<string>();
  for (const b of [...VARSAYILAN_TEMIZLIK_BOLGELERI, ...mevcut, ...ek]) {
    const t = b.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}
