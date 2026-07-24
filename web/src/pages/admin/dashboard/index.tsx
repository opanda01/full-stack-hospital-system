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

type AdminOzet = {
  kullanici_sayisi: number;
  doktor_sayisi: number;
  departman_sayisi: number;
  personel_sayisi: number;
  randevu_bekleyen: number;
  randevu_toplam: number;
};

type Sikayet = { id: number };
type Temizlik = { id: number; durum?: string };
type Hasta = { id: number };

export function AdminDashboardPage() {
  const { data: ozet, isLoading } = useQuery({
    queryKey: ["dashboard-admin-ozet"],
    queryFn: async () => (await api.get<AdminOzet>("/dashboard/admin/ozet")).data,
  });
  const { data: sikayetler = [] } = useQuery({
    queryKey: ["sikayet-oneri"],
    queryFn: async () => (await api.get<Sikayet[]>("/sikayet-oneri/")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-count"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/")).data,
  });
  const { data: temizlikler = [] } = useQuery({
    queryKey: ["temizlik-gorevleri"],
    queryFn: async () =>
      (await api.get<Temizlik[]>("/temizlik-gorevleri/")).data,
  });

  const acikTemizlik = temizlikler.filter(
    (t) => t.durum !== "TAMAMLANDI" && t.durum !== "IPTAL",
  ).length;

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Toplam kullanıcı",
          value: isLoading ? "…" : (ozet?.kullanici_sayisi ?? 0),
          icon: Users,
          to: "/admin/kullanicilar",
        },
        {
          label: "Aktif doktor",
          value: isLoading ? "…" : (ozet?.doktor_sayisi ?? 0),
          icon: Stethoscope,
          to: "/admin/doktorlar",
        },
        {
          label: "Departman",
          value: isLoading ? "…" : (ozet?.departman_sayisi ?? 0),
          icon: Building2,
          to: "/admin/departmanlar",
        },
        {
          label: "Bekleyen randevu",
          value: isLoading ? "…" : (ozet?.randevu_bekleyen ?? 0),
          icon: CalendarClock,
          to: "/admin/randevular",
        },
        {
          label: "Hastalar",
          value: hastalar.length,
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
          value: acikTemizlik,
          icon: Sparkles,
          to: "/admin/temizlik",
        },
        {
          label: "Şikayet / öneri",
          value: sikayetler.length,
          icon: MessageSquareWarning,
          to: "/admin/sikayet",
        },
      ]}
    />
  );
}
