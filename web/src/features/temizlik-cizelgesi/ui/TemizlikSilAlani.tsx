import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";
import { temizlikSilDropId } from "../lib/cells";

export function TemizlikSilAlani({ canEdit }: { canEdit: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: temizlikSilDropId,
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-dashed px-4 py-3 text-center text-xs text-muted-foreground",
        canEdit && isOver && "border-destructive bg-destructive/10 text-destructive",
      )}
    >
      Görevi kaldırmak için buraya sürükleyin
    </div>
  );
}
