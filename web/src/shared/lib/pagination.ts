/** Backend Page[T] envelope helpers. */

export type PageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export function unwrapPage<T>(data: PageResponse<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export function pageTotal(data: PageResponse<unknown> | unknown[]): number {
  if (Array.isArray(data)) return data.length;
  return data?.total ?? 0;
}

/** Lookup / dropdown: max API page_size. */
export const LOOKUP_PAGE_SIZE = 200;
