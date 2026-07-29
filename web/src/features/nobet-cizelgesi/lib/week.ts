export function mondayOfWeek(d: Date = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return toIsoDate(x);
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toIsoDate(dt);
}

export function weekDays(haftaBaslangic: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIso(haftaBaslangic, i));
}

export function shiftWeek(haftaBaslangic: string, deltaWeeks: number): string {
  return addDaysIso(haftaBaslangic, deltaWeeks * 7);
}

const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function gunEtiketi(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const idx = (dt.getDay() + 6) % 7;
  return `${GUN_ADLARI[idx]} ${d}.${m}`;
}

export const VARDIYALAR = [
  { id: "SABAH", label: "Sabah" },
  { id: "AKSAM", label: "Akşam" },
  { id: "GECE", label: "Gece" },
] as const;

export type VardiyaId = (typeof VARDIYALAR)[number]["id"];

export function normalizeIsoDate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function cellDroppableId(
  departmanId: number,
  tarih: string,
  vardiya: string,
  sira = 0,
) {
  return `cell|${departmanId}|${normalizeIsoDate(tarih)}|${vardiya}|${sira}`;
}

export function parseCellId(id: string) {
  if (!id.startsWith("cell|")) return null;
  const parts = id.split("|");
  if (parts.length < 5) return null;
  const [, dep, tarih, vardiya, sira] = parts;
  return {
    departmanId: Number(dep),
    tarih: normalizeIsoDate(tarih),
    vardiya,
    sira: Number(sira) || 0,
  };
}

export function poolDraggableId(personelId: number) {
  return `pool:${personelId}`;
}

export function nobetDraggableId(nobetId: number) {
  return `nobet:${nobetId}`;
}

export function parseDragId(id: string) {
  if (id.startsWith("pool:")) {
    return { kind: "pool" as const, personelId: Number(id.slice(5)) };
  }
  if (id.startsWith("nobet:")) {
    return { kind: "nobet" as const, nobetId: Number(id.slice(6)) };
  }
  return null;
}
