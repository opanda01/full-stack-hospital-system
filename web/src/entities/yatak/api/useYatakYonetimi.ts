import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { ServisDolulukOzet, ServisOzet, YatakOzet } from "../model/types";

export function useServisler() {
  return useQuery({
    queryKey: ["yatak-yonetimi-servisler"],
    queryFn: async () =>
      (await api.get<ServisOzet[]>("/yatak-yonetimi/servisler")).data,
  });
}

export function useServisYataklar(servisId: number | null) {
  return useQuery({
    queryKey: ["yatak-yonetimi-yataklar", servisId],
    queryFn: async () =>
      (
        await api.get<YatakOzet[]>(
          `/yatak-yonetimi/servisler/${servisId}/yataklar`,
        )
      ).data,
    enabled: servisId != null,
  });
}

export function useServisDoluluk(servisId: number | null) {
  return useQuery({
    queryKey: ["yatak-yonetimi-doluluk", servisId],
    queryFn: async () =>
      (
        await api.get<ServisDolulukOzet>(
          `/yatak-yonetimi/servisler/${servisId}/doluluk`,
        )
      ).data,
    enabled: servisId != null,
  });
}
