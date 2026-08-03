import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { fetchAllPages } from "@/shared/lib";
import type {
  AmeliyathaneOzet,
  AmeliyathaneTakvim,
  AmeliyatPlaniOzet,
} from "../model/types";

export function useAmeliyathaneler() {
  return useQuery({
    queryKey: ["ameliyathaneler"],
    queryFn: async () =>
      (await api.get<AmeliyathaneOzet[]>("/ameliyathane/ameliyathaneler")).data,
  });
}

export function useAmeliyatPlanlari() {
  return useQuery({
    queryKey: ["ameliyat-planlari"],
    queryFn: () => fetchAllPages<AmeliyatPlaniOzet>("/ameliyathane/ameliyatlar"),
  });
}

export function useAmeliyathaneTakvim(
  ameliyathaneId: number | null,
  gun: string,
) {
  return useQuery({
    queryKey: ["ameliyathane-takvim", ameliyathaneId, gun],
    queryFn: async () =>
      (
        await api.get<AmeliyathaneTakvim>(
          `/ameliyathane/ameliyathaneler/${ameliyathaneId}/takvim`,
          { params: { gun } },
        )
      ).data,
    enabled: ameliyathaneId != null && gun.length > 0,
  });
}

export function useAmeliyatAksiyonlari() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ameliyat-planlari"] });
    qc.invalidateQueries({ queryKey: ["ameliyathane-takvim"] });
    qc.invalidateQueries({ queryKey: ["ameliyathaneler"] });
  };

  const baslat = useMutation({
    mutationFn: async (planId: number) =>
      (
        await api.post<AmeliyatPlaniOzet>(
          `/ameliyathane/ameliyatlar/${planId}/baslat`,
        )
      ).data,
    onSuccess: invalidate,
  });

  const tamamla = useMutation({
    mutationFn: async (planId: number) =>
      (
        await api.post<AmeliyatPlaniOzet>(
          `/ameliyathane/ameliyatlar/${planId}/tamamla`,
        )
      ).data,
    onSuccess: invalidate,
  });

  return { baslat, tamamla };
}
