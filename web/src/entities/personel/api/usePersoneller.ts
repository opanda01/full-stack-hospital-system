import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Personel } from "../model/types";

export function usePersoneller() {
  return useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });
}
