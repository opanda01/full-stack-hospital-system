import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { NOBET_SILME_DROP_ID } from "../lib/week";

export function NobetSilmeAlani() {
  const { setNodeRef, isOver } = useDroppable({ id: NOBET_SILME_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors",
        isOver
          ? "border-destructive bg-destructive/10 text-destructive"
          : "border-border text-muted-foreground",
      )}
    >
      <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
      <span>Tablodaki nöbeti silmek için buraya sürükleyin</span>
    </div>
  );
}
