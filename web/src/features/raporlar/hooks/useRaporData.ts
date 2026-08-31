import { useQuery } from "@tanstack/react-query";
import {
  fetchFinansRapor,
  fetchKlinikRapor,
  fetchRandevuRapor,
  fetchYatakRapor,
  fetchYatisRapor,
  type RaporFiltre,
} from "@/features/raporlar/api/raporApi";

export function useRandevuRapor(filtre: RaporFiltre, enabled = true) {
  return useQuery({
    queryKey: ["rapor", "randevu", filtre],
    queryFn: () => fetchRandevuRapor(filtre),
    enabled,
  });
}

export function useYatisRapor(filtre: RaporFiltre, enabled = true) {
  return useQuery({
    queryKey: ["rapor", "yatis", filtre],
    queryFn: () => fetchYatisRapor(filtre),
    enabled,
  });
}

export function useYatakRapor(enabled = true) {
  return useQuery({
    queryKey: ["rapor", "yatak"],
    queryFn: fetchYatakRapor,
    enabled,
  });
}

export function useFinansRapor(filtre: RaporFiltre, enabled = true) {
  return useQuery({
    queryKey: ["rapor", "finans", filtre],
    queryFn: () => fetchFinansRapor(filtre),
    enabled,
  });
}

export function useKlinikRapor(enabled = true) {
  return useQuery({
    queryKey: ["rapor", "klinik"],
    queryFn: fetchKlinikRapor,
    enabled,
  });
}
