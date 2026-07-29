import { api } from "@/shared/api";
import { LOOKUP_PAGE_SIZE, pageTotal, unwrapPage, type PageResponse } from "./pagination";

const MAX_PAGE = LOOKUP_PAGE_SIZE;

/** Tüm sayfaları çeker (API page_size üst sınırına uyar). */
export async function fetchAllPages<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let total = 0;

  do {
    const { data } = await api.get<PageResponse<T>>(path, {
      params: { ...params, page, page_size: MAX_PAGE },
    });
    const chunk = unwrapPage(data);
    all.push(...chunk);
    total = pageTotal(data);
    if (chunk.length === 0) break;
    page += 1;
  } while (all.length < total);

  return all;
}
