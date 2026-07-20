import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Doktor } from "../model/types";

export function useDoktorlar() {
  return useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });
}
