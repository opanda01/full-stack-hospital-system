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
import { DashboardGrid } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";
import { pageTotal } from "@/shared/lib";

const RENK = ["success", "accent", "warning", "notr"] as const;

export function AdminDashboardOzetTab() {
  const { ozet, isLoading, hastaPage, acikTemizlik, sikayetPage } =
    useAdminDashboardData();

  const metrics = [
    {
      label: "Toplam kullanıcı",
      value: isLoading ? "…" : (ozet.data?.kullanici_sayisi ?? 0),
      icon: Users,
      to: "/admin/kullanicilar",
    },
    {
      label: "Aktif doktor",
      value: isLoading ? "…" : (ozet.data?.doktor_sayisi ?? 0),
      icon: Stethoscope,
      to: "/admin/doktorlar",
    },
    {
      label: "Departman",
      value: isLoading ? "…" : (ozet.data?.departman_sayisi ?? 0),
      icon: Building2,
      to: "/admin/departmanlar",
    },
    {
      label: "Bekleyen randevu",
      value: isLoading ? "…" : (ozet.data?.randevu_bekleyen ?? 0),
      icon: CalendarClock,
      to: "/admin/randevular",
    },
    {
      label: "Hastalar",
      value: hastaPage.data ? pageTotal(hastaPage.data) : "…",
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
      value: sikayetPage.data ? pageTotal(sikayetPage.data) : "…",
      icon: MessageSquareWarning,
      to: "/admin/sikayet",
    },
  ];

  return (
    <DashboardGrid>
      {metrics.map((m, i) => (
        <MetricCard
          key={m.label}
          label={m.label}
          value={m.value}
          icon={m.icon}
          renk={RENK[i % RENK.length]}
          to={m.to}
        />
      ))}
    </DashboardGrid>
  );
}
