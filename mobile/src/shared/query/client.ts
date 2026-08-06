import { QueryClient } from "@tanstack/react-query";

/** Tab geçişlerinde önbelleği kısa süre taze say. */
export const HASTA_STALE_MS = 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: HASTA_STALE_MS,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  ozet: ["hasta", "ozet"] as const,
  profil: ["hasta", "profil"] as const,
  belgeler: (page: number) => ["hasta", "belgeler", page] as const,
  belgelerIlkSayfa: ["hasta", "belgeler", "p1"] as const,
  randevular: ["hasta", "randevular"] as const,
  tetkikler: ["hasta", "tetkikler"] as const,
  muayeneler: ["hasta", "muayeneler", "p1"] as const,
  receteler: ["hasta", "receteler"] as const,
  muayene: (id: number) => ["hasta", "muayene", id] as const,
  tetkik: (id: string) => ["hasta", "tetkik", id] as const,
  belge: (kaynak: string, id: number) => ["hasta", "belge", kaynak, id] as const,
  sikayetBenim: ["hasta", "sikayet", "benim"] as const,
  randevuAlBootstrap: ["hasta", "randevu-al", "bootstrap"] as const,
};
