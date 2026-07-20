import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Departman } from "../model/types";

export function useDepartmanlar() {
  return useQuery({
    queryKey: ["departman"],
    queryFn: async () => {
      const { data } = await api.get<Departman[]>("/departmanlar");
      return data;
    },
    enabled: false,
  });
}
