import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import type { Kullanici } from "../model/types";

export function useKullanicilar() {
  return useQuery({
    queryKey: ["kullanici"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Kullanici>>("/kullanicilar", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
    enabled: false,
  });
}
