import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Doktor } from "../model/types";

async function fetchDoktorlar(): Promise<Doktor[]> {
  // TODO: GET /doktorlar
  const { data } = await api.get<Doktor[]>("/doktorlar");
  return data;
}

export function useDoktorlar() {
  return useQuery({
    queryKey: ["doktorlar"],
    queryFn: fetchDoktorlar,
    enabled: false, // iskelet: API hazır olunca aç
  });
}
