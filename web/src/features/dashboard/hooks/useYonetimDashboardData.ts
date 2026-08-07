import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { SikayetOzet } from "@/features/sikayet-oneri/types";
import {
  LOOKUP_PAGE_SIZE,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
type Personel = { id: number };
type Doktor = { id: number };
type Departman = { id: number };
type Randevu = { id: string; tarih_saat: string; durum: string };
type Sikayet = { id: number; baslik?: string };
type Temizlik = { id: number; durum?: string };
type Hasta = { id: string };

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useYonetimDashboardData(root: "/mudur" | "/bashekim", options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const personelPage = useQuery({
    queryKey: ["personel-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Personel>>("/personel/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
    enabled,
  });

  const doktorPage = useQuery({
    queryKey: ["doktorlar-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Doktor>>("/doktorlar/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
    enabled,
  });

  const departmanlar = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
    enabled,
  });

  const randevular = useQuery({
    queryKey: ["randevular"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
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

  const loading =
    personelPage.isLoading ||
    doktorPage.isLoading ||
    departmanlar.isLoading ||
    randevular.isLoading ||
    sikayetOzet.isLoading ||
    temizlikler.isLoading ||
    hastaPage.isLoading;

  const bugunRandevu =
    randevular.data?.filter(
      (r) => r.durum !== "IPTAL" && isToday(r.tarih_saat),
    ).length ?? 0;

  const acikTemizlik =
    temizlikler.data?.filter(
      (t) => t.durum !== "TAMAMLANDI" && t.durum !== "IPTAL",
    ).length ?? 0;

  return {
    root,
    loading,
    personelPage,
    doktorPage,
    departmanlar,
    randevular,
    bugunRandevu,
    sikayetOzet,
    sikayetList,
    acikTemizlik,
    hastaPage,
    pageTotal,
  };
}
