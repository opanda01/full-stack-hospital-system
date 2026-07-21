import { useEffect, useId } from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  pending = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/40"
        disabled={pending}
        onClick={() => {
          if (!pending) onCancel();
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "İşleniyor…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
