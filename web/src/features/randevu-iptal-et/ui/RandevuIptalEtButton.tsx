import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, ConfirmDialog } from "@/shared/ui";
import { api } from "@/shared/api";
import { randevuIptalEdilebilir } from "../lib/can-cancel-randevu";

type RandevuIptalEtButtonProps = {
  randevuId: string;
  tarihSaat: string;
  durum: string;
};

export function RandevuIptalEtButton({
  randevuId,
  tarihSaat,
  durum,
}: RandevuIptalEtButtonProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const canCancel = randevuIptalEdilebilir(durum, tarihSaat);
  const mut = useMutation({
    mutationFn: () => api.delete(`/randevular/${randevuId}`),
    onSuccess: () => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["hasta-randevular"] });
      qc.invalidateQueries({ queryKey: ["randevularim"] });
      qc.invalidateQueries({ queryKey: ["randevular"] });
    },
  });

  if (!canCancel) return null;

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
