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

type Personel = { id: number };
type Doktor = { id: number };
type Departman = { id: number };
type Randevu = { id: number; tarih_saat: string; durum: string };
type Sikayet = { id: number };
type Temizlik = { id: number; durum?: string };
type Hasta = { id: number };

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
  const { data: personeller = [], isLoading: l1 } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });
  const { data: doktorlar = [], isLoading: l2 } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });
  const { data: departmanlar = [], isLoading: l3 } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: randevular = [], isLoading: l4 } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: sikayetler = [], isLoading: l5 } = useQuery({
    queryKey: ["sikayet-oneri"],
    queryFn: async () => (await api.get<Sikayet[]>("/sikayet-oneri/")).data,
  });
  const { data: temizlikler = [], isLoading: l6 } = useQuery({
    queryKey: ["temizlik-gorevleri"],
    queryFn: async () =>
      (await api.get<Temizlik[]>("/temizlik-gorevleri/")).data,
  });
  const { data: hastalar = [], isLoading: l7 } = useQuery({
    queryKey: ["hastalar"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/")).data,
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
          value: loading ? "…" : personeller.length,
          icon: IdCard,
          to: `${root}/personel`,
        },
        {
          label: "Doktor",
          value: loading ? "…" : doktorlar.length,
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
          value: loading ? "…" : hastalar.length,
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
          value: loading ? "…" : sikayetler.length,
          icon: MessageSquareWarning,
          to: `${root}/sikayet`,
        },
      ]}
    />
  );
}
