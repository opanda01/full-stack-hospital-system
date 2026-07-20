import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";

export function TemizlikGoreviTamamlaButton({ gorevId }: { gorevId: number }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () =>
      api.patch(`/temizlik-gorevleri/${gorevId}`, { durum: "TAMAMLANDI" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temizlik"] }),
  });

  return (
    <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
      Tamamla
    </Button>
  );
}
