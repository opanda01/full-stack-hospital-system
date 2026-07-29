import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { temizlikCellId } from "../lib/cells";

type Props = {
  odaBolum: string;
  tarih: string;
  canEdit: boolean;
  children: ReactNode;
};

export function TemizlikHucre({ odaBolum, tarih, canEdit, children }: Props) {
  const id = temizlikCellId(odaBolum, tarih);
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !canEdit });

  return (
    <td
      ref={setNodeRef}
      className={cn(
        "min-w-[6.5rem] border px-1 py-1 align-top",
        canEdit && isOver && "bg-[var(--card-success-bg)] ring-1 ring-[var(--border-accent)]",
      )}
    >
      <div className="min-h-[2.25rem]">{children}</div>
    </td>
  );
}
