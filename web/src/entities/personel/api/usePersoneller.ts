import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import type { Personel } from "../model/types";

export function usePersoneller() {
  return useQuery({
    queryKey: ["personel"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Personel>>("/personel/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
}
