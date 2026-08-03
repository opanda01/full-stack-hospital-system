import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { AmeliyatPlaniOzet } from "@/entities/ameliyat";

export type AmeliyatPlanlaInput = {
  hasta_id: string;
  ameliyathane_id: number;
  sorumlu_cerrah_id: number;
  planlanan_baslangic: string;
  planlanan_sure_dk: number;
  ameliyat_adi: string;
};

export function useAmeliyatPlanla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AmeliyatPlanlaInput) =>
      (
        await api.post<AmeliyatPlaniOzet>("/ameliyathane/ameliyatlar", body)
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ameliyat-planlari"] });
      qc.invalidateQueries({ queryKey: ["ameliyathane-takvim"] });
    },
  });
}
