import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";

export function RandevuIptalEtButton({ randevuId }: { randevuId: number }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => api.delete(`/randevular/${randevuId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hasta-randevular"] });
      qc.invalidateQueries({ queryKey: ["randevularim"] });
      qc.invalidateQueries({ queryKey: ["randevular"] });
    },
  });

  return (
    <Button
      type="button"
      disabled={mut.isPending}
      onClick={() => mut.mutate()}
    >
      İptal et
    </Button>
  );
}
