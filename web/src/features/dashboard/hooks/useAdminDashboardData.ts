import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { SikayetOzet } from "@/features/sikayet-oneri/types";
import {
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";

export type AdminOzet = {
  kullanici_sayisi: number;
  doktor_sayisi: number;
  departman_sayisi: number;
  personel_sayisi: number;
  randevu_bekleyen: number;
  randevu_toplam: number;
};

type Sikayet = { id: number; baslik?: string; durum?: string };
type Temizlik = { id: number; durum?: string; alan?: string };
type Hasta = { id: string };
type Randevu = { id: string; durum?: string };

export function useAdminDashboardData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const ozet = useQuery({
    queryKey: ["dashboard-admin-ozet"],
    queryFn: async () => (await api.get<AdminOzet>("/dashboard/admin/ozet")).data,
    enabled,
  });

  const sikayetOzet = useQuery({
    queryKey: ["sikayet-ozet"],
    queryFn: async () =>
      (await api.get<SikayetOzet>("/sikayet-oneri/ozet")).data,
    enabled,
  });

  const sikayetList = useQuery({
    queryKey: ["sikayet-oneri-recent"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Sikayet>>("/sikayet-oneri/", {
            params: { page: 1, page_size: 5 },
          })
        ).data,
      ),
    enabled,
  });

  const hastaPage = useQuery({
    queryKey: ["hastalar-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Hasta>>("/hastalar/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
    enabled,
  });

  const temizlikler = useQuery({
    queryKey: ["temizlik-gorevleri"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Temizlik>>("/temizlik-gorevleri/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
    enabled,
  });

  const randevuBekleyenList = useQuery({
    queryKey: ["randevular-bekleyen-recent"],
    queryFn: async () => {
      const all = unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      );
      return all.filter((r) => r.durum === "BEKLEMEDE" || r.durum === "ONAY_BEKLIYOR").slice(0, 5);
    },
    enabled,
  });

  const acikTemizlik =
    temizlikler.data?.filter(
      (t) => t.durum !== "TAMAMLANDI" && t.durum !== "IPTAL",
    ).length ?? 0;

  return {
    ozet,
    sikayetOzet,
    sikayetList,
    hastaPage,
    temizlikler,
    randevuBekleyenList,
    acikTemizlik,
    isLoading: ozet.isLoading,
  };
}
