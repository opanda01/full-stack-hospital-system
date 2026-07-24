import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  HeartPulse,
  IdCard,
  MessageSquareWarning,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";
import { LOOKUP_PAGE_SIZE, pageTotal, unwrapPage, type PageResponse } from "@/shared/lib";

type Personel = { id: number };
type Doktor = { id: number };
type Departman = { id: number };
type Randevu = { id: string; tarih_saat: string; durum: string };
type Sikayet = { id: number };
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

type Props = { root: "/bashekim" | "/mudur" };

/** Başhekim / Müdür canlı KPI paneli */
export function YonetimDashboardPage({ root }: Props) {
  const { data: personelPage, isLoading: l1 } = useQuery({
    queryKey: ["personel-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Personel>>("/personel/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
  });
  const { data: doktorPage, isLoading: l2 } = useQuery({
    queryKey: ["doktorlar-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Doktor>>("/doktorlar/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
  });
  const { data: departmanlar = [], isLoading: l3 } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: randevular = [], isLoading: l4 } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
  const { data: sikayetPage, isLoading: l5 } = useQuery({
    queryKey: ["sikayet-oneri-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Sikayet>>("/sikayet-oneri/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
  });
  const { data: temizlikler = [], isLoading: l6 } = useQuery({
    queryKey: ["temizlik-gorevleri"],
    queryFn: async () =>
      unwrapPage((await api.get<PageResponse<Temizlik>>("/temizlik-gorevleri/", { params: { page_size: LOOKUP_PAGE_SIZE } })).data),
  });
  const { data: hastaPage, isLoading: l7 } = useQuery({
    queryKey: ["hastalar-count"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Hasta>>("/hastalar/", {
          params: { page: 1, page_size: 1 },
        })
      ).data,
  });

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7;
  const bugunRandevu = randevular.filter(
    (r) => r.durum !== "IPTAL" && isToday(r.tarih_saat),
  ).length;
  const acikTemizlik = temizlikler.filter(
    (t) => t.durum !== "TAMAMLANDI" && t.durum !== "IPTAL",
  ).length;

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Personel",
          value: loading ? "…" : pageTotal(personelPage ?? []),
          icon: IdCard,
          to: `${root}/personel`,
        },
        {
          label: "Doktor",
          value: loading ? "…" : pageTotal(doktorPage ?? []),
          icon: Stethoscope,
          to: `${root}/doktorlar`,
        },
        {
          label: "Departman",
          value: loading ? "…" : departmanlar.length,
          icon: Building2,
          to: `${root}/departmanlar`,
        },
        {
          label: "Bugünkü randevu",
          value: loading ? "…" : bugunRandevu,
          icon: CalendarClock,
          to: `${root}/randevular`,
        },
        {
          label: "Hastalar",
          value: loading ? "…" : pageTotal(hastaPage ?? []),
          icon: HeartPulse,
          to: `${root}/hastalar`,
        },
        {
          label: "Nöbet çizelgesi",
          value: "Git",
          icon: CalendarDays,
          to: `${root}/nobet`,
        },
        {
          label: "Açık temizlik",
          value: loading ? "…" : acikTemizlik,
          icon: Sparkles,
          to: `${root}/temizlik`,
        },
        {
          label: "Şikayet / öneri",
          value: loading ? "…" : pageTotal(sikayetPage ?? []),
          icon: MessageSquareWarning,
          to: `${root}/sikayet`,
        },
      ]}
    />
  );
}
