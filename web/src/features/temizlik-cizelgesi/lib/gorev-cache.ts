import type { TemizlikGorev } from "../model/types";
import { normalizeIsoDate } from "./cells";

export function normalizeTemizlikGorev(g: TemizlikGorev): TemizlikGorev {
  return {
    ...g,
    gorev_tarihi: normalizeIsoDate(String(g.gorev_tarihi)),
  };
}

export function upsertTemizlikGorev(
  list: TemizlikGorev[],
  item: TemizlikGorev,
): TemizlikGorev[] {
  const g = normalizeTemizlikGorev(item);
  const i = list.findIndex((x) => x.id === g.id);
  if (i >= 0) {
    const next = [...list];
    next[i] = g;
    return next;
  }
  return [...list, g];
}

export function removeTemizlikGorev(
  list: TemizlikGorev[],
  id: number,
): TemizlikGorev[] {
  return list.filter((x) => x.id !== id);
}
