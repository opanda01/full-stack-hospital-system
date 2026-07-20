import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Kullanici } from "../model/types";

export function useKullanicilar() {
  return useQuery({
    queryKey: ["kullanici"],
    queryFn: async () => {
      const { data } = await api.get<Kullanici[]>("/kullanicilar");
      return data;
    },
    enabled: false,
  });
}
