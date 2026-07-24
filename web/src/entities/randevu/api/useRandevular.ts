import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { unwrapPage, type PageResponse } from "@/shared/lib";
import type { Randevu } from "../model/types";

export function useRandevular() {
  return useQuery({
    queryKey: ["randevular"],
    queryFn: async () =>
      unwrapPage((await api.get<PageResponse<Randevu>>("/randevular/")).data),
  });
}
