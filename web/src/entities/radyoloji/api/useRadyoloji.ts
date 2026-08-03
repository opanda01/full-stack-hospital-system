import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { fetchAllPages } from "@/shared/lib";
import type { RadyolojiGoruntuLink, RadyolojiIstem } from "../model/types";

export function useRadyolojiIstemleri() {
  return useQuery({
    queryKey: ["radyoloji-istemleri"],
    queryFn: () => fetchAllPages<RadyolojiIstem>("/radyoloji/istemler"),
  });
}

export function useRadyolojiGoruntuLink(istemId: number | null) {
  return useQuery({
    queryKey: ["radyoloji-goruntu", istemId],
    queryFn: async () =>
      (
        await api.get<RadyolojiGoruntuLink>(
          `/radyoloji/istemler/${istemId}/goruntu-linki`,
        )
      ).data,
    enabled: istemId != null,
  });
}

export function useRadyolojiRaporGir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      istemId,
      body,
    }: {
      istemId: number;
      body: {
        rapor_metni: string;
        orthanc_study_instance_uid: string;
        orthanc_series_instance_uid?: string;
      };
    }) =>
      (
        await api.post<RadyolojiIstem>(
          `/radyoloji/istemler/${istemId}/rapor`,
          body,
        )
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["radyoloji-istemleri"] });
    },
  });
}
