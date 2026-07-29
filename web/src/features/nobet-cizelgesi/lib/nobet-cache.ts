import type { NobetKaydi } from "../model/types";
import { normalizeIsoDate } from "./week";

export function normalizeNobetKaydi(n: NobetKaydi): NobetKaydi {
  return {
    ...n,
    tarih: normalizeIsoDate(String(n.tarih)),
    vardiya: String(n.vardiya),
  };
}

export function upsertNobetKaydi(
  list: NobetKaydi[],
  item: NobetKaydi,
): NobetKaydi[] {
  const n = normalizeNobetKaydi(item);
  const i = list.findIndex((x) => x.id === n.id);
  if (i >= 0) {
    const next = [...list];
    next[i] = n;
    return next;
  }
  return [...list, n];
}

export function removeNobetKaydi(list: NobetKaydi[], id: number): NobetKaydi[] {
  return list.filter((x) => x.id !== id);
}
