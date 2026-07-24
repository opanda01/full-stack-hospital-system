import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import type { Doktor } from "../model/types";

export function useDoktorlar() {
  return useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Doktor>>("/doktorlar/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
}
