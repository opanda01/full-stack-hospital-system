import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { YatakOzet } from "@/entities/yatak";

export function useYatakAta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      yatakId,
      yatisId,
    }: {
      yatakId: number;
      yatisId: number;
    }) =>
      (
        await api.post<YatakOzet>(`/yatak-yonetimi/yataklar/${yatakId}/ata`, {
          yatis_id: yatisId,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yatak-yonetimi-yataklar"] });
      qc.invalidateQueries({ queryKey: ["yatak-yonetimi-doluluk"] });
      qc.invalidateQueries({ queryKey: ["yatis-kayitlar"] });
    },
  });
}

export function useYatakBosalt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (yatakId: number) =>
      (
        await api.post<YatakOzet>(
          `/yatak-yonetimi/yataklar/${yatakId}/bosalt`,
        )
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yatak-yonetimi-yataklar"] });
      qc.invalidateQueries({ queryKey: ["yatak-yonetimi-doluluk"] });
      qc.invalidateQueries({ queryKey: ["yatis-kayitlar"] });
    },
  });
}
