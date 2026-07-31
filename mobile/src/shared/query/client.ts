import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  ozet: ["hasta", "ozet"] as const,
  belgeler: (page: number) => ["hasta", "belgeler", page] as const,
  randevular: ["hasta", "randevular"] as const,
  tetkikler: ["hasta", "tetkikler"] as const,
  muayene: (id: number) => ["hasta", "muayene", id] as const,
  sikayetBenim: ["hasta", "sikayet", "benim"] as const,
};
