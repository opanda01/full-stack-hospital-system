import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";
import { temizlikGorevId, temizlikPoolId } from "../lib/cells";

type Props = {
  personelId: number;
  label: string;
  gorevId?: number;
  disabled?: boolean;
};

export function TemizlikPersonelChip({
  personelId,
  label,
  gorevId,
  disabled,
}: Props) {
  const id =
    gorevId != null ? temizlikGorevId(gorevId) : temizlikPoolId(personelId);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
    data: { personelId, gorevId },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full rounded border px-2 py-1 text-left text-xs font-medium",
        "border-[color:var(--border-accent)] bg-[var(--panel-bg)]",
        isDragging && "invisible",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {label}
    </button>
  );
}
