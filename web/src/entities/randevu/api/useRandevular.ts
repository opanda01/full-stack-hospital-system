import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Randevu } from "../model/types";

export function useRandevular() {
  return useQuery({
    queryKey: ["randevu"],
    queryFn: async () => {
      const { data } = await api.get<Randevu[]>("/randevular");
      return data;
    },
    enabled: false,
  });
}
