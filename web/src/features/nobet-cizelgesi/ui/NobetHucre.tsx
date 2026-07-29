import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { cellDroppableId } from "../lib/week";

type NobetHucreProps = {
  departmanId: number;
  tarih: string;
  vardiya: string;
  sira?: number;
  canEdit: boolean;
  children: ReactNode;
  onEmptyActivate?: () => void;
};

export function NobetHucre({
  departmanId,
  tarih,
  vardiya,
  sira = 0,
  canEdit,
  children,
  onEmptyActivate,
}: NobetHucreProps) {
  const id = cellDroppableId(departmanId, tarih, vardiya, sira);
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !canEdit,
    data: { type: "nobet-cell", departmanId, tarih, vardiya, sira },
  });

  return (
    <td className="min-w-[7rem] border px-1 py-1 align-top">
      <div
        ref={setNodeRef}
        role={onEmptyActivate ? "button" : undefined}
        tabIndex={onEmptyActivate ? 0 : undefined}
        onClick={(e) => {
          if (!onEmptyActivate) return;
          if (e.target === e.currentTarget) onEmptyActivate();
        }}
        onKeyDown={(e) => {
          if (!onEmptyActivate) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onEmptyActivate();
          }
        }}
        className={cn(
          "min-h-[2.75rem] w-full rounded-sm",
          canEdit && isOver && "bg-[var(--card-accent-bg)] ring-1 ring-[var(--border-accent)]",
          onEmptyActivate && "cursor-pointer",
        )}
      >
        {children}
      </div>
    </td>
  );
}
