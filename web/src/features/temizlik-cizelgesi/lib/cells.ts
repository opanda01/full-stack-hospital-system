import {
  gunEtiketi,
  mondayOfWeek,
  normalizeIsoDate,
  shiftWeek,
  weekDays,
} from "@/features/nobet-cizelgesi/lib/week";

export { mondayOfWeek, shiftWeek, weekDays, gunEtiketi, normalizeIsoDate };

export function temizlikCellId(odaBolum: string, tarih: string) {
  return `tcll|${encodeURIComponent(odaBolum)}|${normalizeIsoDate(tarih)}`;
}

export function parseTemizlikCellId(id: string) {
  if (!id.startsWith("tcll|")) return null;
  const parts = id.split("|");
  if (parts.length < 3) return null;
  const tarih = normalizeIsoDate(parts[parts.length - 1] ?? "");
  const odaEnc = parts.slice(1, -1).join("|");
  if (!odaEnc || !tarih) return null;
  return { odaBolum: decodeURIComponent(odaEnc), tarih };
}

export function temizlikPoolId(personelId: number) {
  return `tpool:${personelId}`;
}

export function temizlikGorevId(gorevId: number) {
  return `tgorev:${gorevId}`;
}

export function parseTemizlikDragId(id: string) {
  if (id.startsWith("tpool:")) {
    return { kind: "pool" as const, personelId: Number(id.slice(6)) };
  }
  if (id.startsWith("tgorev:")) {
    return { kind: "gorev" as const, gorevId: Number(id.slice(7)) };
  }
  return null;
}

export const temizlikSilDropId = "tcll-sil";
