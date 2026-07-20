import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Departman } from "../model/types";

export function useDepartmanlar() {
  return useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
}
