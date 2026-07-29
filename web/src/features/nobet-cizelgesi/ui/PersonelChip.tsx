import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";
import { nobetDraggableId, poolDraggableId } from "../lib/week";

type PersonelChipProps = {
  personelId: number;
  label: string;
  nobetId?: number;
  disabled?: boolean;
};

export function PersonelChip({
  personelId,
  label,
  nobetId,
  disabled,
}: PersonelChipProps) {
  const id = nobetId != null ? nobetDraggableId(nobetId) : poolDraggableId(personelId);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
    data: { personelId, nobetId },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full touch-none rounded border px-2 py-1 text-left text-xs font-medium transition-colors",
        "border-[color:var(--border-accent)] bg-[var(--panel-bg)]",
        "hover:bg-[var(--panel-inset-bg)]",
        isDragging && "invisible",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {label}
    </button>
  );
}
