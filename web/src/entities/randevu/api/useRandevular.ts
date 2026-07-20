import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Randevu } from "../model/types";

export function useRandevular() {
  return useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
}
