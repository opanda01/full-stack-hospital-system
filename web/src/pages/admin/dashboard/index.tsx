import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  HeartPulse,
  MessageSquareWarning,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type Kullanici = { id: number };
type Doktor = { id: number };
type Departman = { id: number };
type Randevu = { id: number; tarih_saat: string; durum: string };
type Sikayet = { id: number };
type Temizlik = { id: number; durum?: string };

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function AdminDashboardPage() {
  const { data: kullanicilar = [], isLoading: l1 } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
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
    queryFn: async () =>
      (await api.get<Sikayet[]>("/sikayet-oneri/")).data,
  });
  const { data: hastalar = [], isLoading: lHastalar } = useQuery({
    queryKey: ["hastalar"],
    queryFn: async () => (await api.get<{ id: number }[]>("/hastalar/")).data,
  });
  const { data: temizlikler = [], isLoading: l6 } = useQuery({
    queryKey: ["temizlik-gorevleri"],
    queryFn: async () =>
      (await api.get<Temizlik[]>("/temizlik-gorevleri/")).data,
  });

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || lHastalar;
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
          label: "Toplam kullanıcı",
          value: loading ? "…" : kullanicilar.length,
          icon: Users,
          to: "/admin/kullanicilar",
        },
        {
          label: "Aktif doktor",
          value: loading ? "…" : doktorlar.length,
          icon: Stethoscope,
          to: "/admin/doktorlar",
        },
        {
          label: "Departman",
          value: loading ? "…" : departmanlar.length,
          icon: Building2,
          to: "/admin/departmanlar",
        },
        {
          label: "Bugünkü randevu",
          value: loading ? "…" : bugunRandevu,
          icon: CalendarClock,
          to: "/admin/randevular",
        },
        {
          label: "Hastalar",
          value: loading ? "…" : hastalar.length,
          icon: HeartPulse,
          to: "/admin/hastalar",
        },
        {
          label: "Nöbet çizelgesi",
          value: "Git",
          icon: CalendarDays,
          to: "/admin/nobet",
        },
        {
          label: "Açık temizlik",
          value: loading ? "…" : acikTemizlik,
          icon: Sparkles,
          to: "/admin/temizlik",
        },
        {
          label: "Şikayet / öneri",
          value: loading ? "…" : sikayetler.length,
          icon: MessageSquareWarning,
          to: "/admin/sikayet",
        },
      ]}
    />
  );
}
