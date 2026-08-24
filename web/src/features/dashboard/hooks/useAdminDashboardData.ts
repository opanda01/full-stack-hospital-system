import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { unwrapPage, type PageResponse } from "@/shared/lib";

export type AdminOzet = {
  kullanici_sayisi: number;
  doktor_sayisi: number;
  departman_sayisi: number;
  personel_sayisi: number;
  randevu_bekleyen: number;
  randevu_toplam: number;
  randevu_onay_bekleyen: number;
  sikayet_bekleyen: number;
  temizlik_acik: number;
  yatak_dolu: number;
  yatak_bos: number;
  aktif_yatis: number;
  nobet_bugun: number;
};

export type GunlukAdet = { tarih: string; adet: number };

export type AdminTrend = {
  randevu_gunluk: GunlukAdet[];
  yatis_gunluk: GunlukAdet[];
};

export type ServisDolulukSatir = {
  servis_id: number;
  servis_adi: string;
  dolu: number;
  toplam: number;
  oran: number;
};

type SikayetOzet = { toplam: number; bekleyen: number; cozulen: number };
type Sikayet = { id: number; baslik?: string; durum?: string };
type Hasta = { id: string };
type Randevu = { id: string; durum?: string; tarih_saat?: string };

type AnalyticsOzet = {
  yatak_dolu: number;
  yatak_bos: number;
};

export function useAdminDashboardData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const ozet = useQuery({
    queryKey: ["dashboard-admin-ozet"],
    queryFn: async () => (await api.get<AdminOzet>("/dashboard/admin/ozet")).data,
    enabled,
  });

  const sikayetOzet = useQuery({
    queryKey: ["sikayet-ozet"],
    queryFn: async () => (await api.get<SikayetOzet>("/sikayet-oneri/ozet")).data,
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

  const trend = useQuery({
    queryKey: ["dashboard-admin-trend"],
    queryFn: async () =>
      (await api.get<AdminTrend>("/dashboard/admin/trend", { params: { gun: 7 } }))
        .data,
    enabled,
  });

  const servisDoluluk = useQuery({
    queryKey: ["dashboard-admin-servis-doluluk"],
    queryFn: async () =>
      (await api.get<ServisDolulukSatir[]>("/dashboard/admin/servis-doluluk")).data,
    enabled,
  });

  const analytics = useQuery({
    queryKey: ["dashboard-analytics-ozet"],
    queryFn: async () =>
      (await api.get<AnalyticsOzet>("/dashboard/analytics/ozet")).data,
    enabled,
  });

  const randevuBekleyenList = useQuery({
    queryKey: ["randevular-bekleyen-recent"],
    queryFn: async () => {
      const all = unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page: 1, page_size: 20 },
          })
        ).data,
      );
      return all
        .filter((r) => r.durum === "BEKLEMEDE" || r.durum === "ONAY_BEKLIYOR")
        .slice(0, 5);
    },
    enabled,
  });

  return {
    ozet,
    sikayetOzet,
    sikayetList,
    hastaPage,
    trend,
    servisDoluluk,
    analytics,
    randevuBekleyenList,
    isLoading: ozet.isLoading,
  };
}
