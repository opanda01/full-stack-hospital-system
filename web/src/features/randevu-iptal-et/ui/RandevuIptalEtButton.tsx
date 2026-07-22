import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, ConfirmDialog } from "@/shared/ui";
import { api } from "@/shared/api";

export function RandevuIptalEtButton({ randevuId }: { randevuId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const mut = useMutation({
    mutationFn: () => api.delete(`/randevular/${randevuId}`),
    onSuccess: () => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["hasta-randevular"] });
      qc.invalidateQueries({ queryKey: ["randevularim"] });
      qc.invalidateQueries({ queryKey: ["randevular"] });
    },
  });

  return (
    <>
      <Button
        type="button"
        disabled={mut.isPending}
        onClick={() => setOpen(true)}
      >
        İptal et
      </Button>
      <ConfirmDialog
        open={open}
        title="Randevuyu iptal et"
        description="Bu randevuyu iptal etmek istediğinize emin misiniz?"
        confirmLabel="İptal et"
        destructive
        pending={mut.isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => mut.mutate()}
      />
    </>
  );
}
