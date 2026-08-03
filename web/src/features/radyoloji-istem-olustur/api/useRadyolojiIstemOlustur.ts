import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { RadyolojiIstem } from "@/entities/radyoloji";

export type RadyolojiIstemInput = {
  hasta_id: string;
  isteyen_doktor_id: number;
  tetkik_turu: string;
  vucut_bolgesi: string;
  aciliyet?: string;
  muayene_id?: number;
};

export function useRadyolojiIstemOlustur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RadyolojiIstemInput) =>
      (await api.post<RadyolojiIstem>("/radyoloji/istemler", body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["radyoloji-istemleri"] });
    },
  });
}
