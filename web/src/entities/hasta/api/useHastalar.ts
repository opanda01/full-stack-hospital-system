import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import type { Hasta } from "../model/types";

export function useHastalar() {
  return useQuery({
    queryKey: ["hasta"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Hasta>>("/hastalar", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
    enabled: false,
  });
}
