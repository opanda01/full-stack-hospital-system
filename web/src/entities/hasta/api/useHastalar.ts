import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Hasta } from "../model/types";

export function useHastalar() {
  return useQuery({
    queryKey: ["hasta"],
    queryFn: async () => {
      const { data } = await api.get<Hasta[]>("/hastalar");
      return data;
    },
    enabled: false,
  });
}
