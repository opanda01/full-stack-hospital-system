import type { DragEndEvent } from "@dnd-kit/core";
import { parseCellId } from "./week";

export function isNobetCellDroppableId(id: string | number): boolean {
  return String(id).startsWith("cell|");
}

/** Drop hedefi iç içe draggable/buton yüzünden `over` hücre olmayabilir; collisions'dan çöz. */
export function resolveNobetCellFromDragEnd(event: DragEndEvent) {
  const seen = new Set<string>();
  const ids: string[] = [];

  const push = (id: string | number | undefined) => {
    if (id == null) return;
    const s = String(id);
    if (seen.has(s)) return;
    seen.add(s);
    ids.push(s);
  };

  push(event.over?.id);
  for (const c of event.collisions ?? []) {
    push(c.id);
  }

  for (const id of ids) {
    if (!isNobetCellDroppableId(id)) continue;
    const cell = parseCellId(id);
    if (cell) return cell;
  }
  return null;
}
