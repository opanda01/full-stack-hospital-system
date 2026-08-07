import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

export type BashekimOzet = {
  bekleyen_erisim: number;
  bugun_randevu: number;
  acik_sikayet: number;
  bekleyen_tetkik: number;
  acik_temizlik: number;
  bekleyen_klinik_onay: number;
  son_denetim: { id: number; aksiyon: string; zaman: string | null }[];
  cached: boolean;
  cache_ttl_sec: number;
};

export function useBashekimOzet(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["bashekim-ozet"],
    queryFn: async () => (await api.get<BashekimOzet>("/bashekim/ozet")).data,
    enabled: options?.enabled ?? true,
  });
}
