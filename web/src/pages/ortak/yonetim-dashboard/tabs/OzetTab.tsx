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
import { DashboardGrid } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useYonetimDashboardData } from "@/features/dashboard/hooks/useYonetimDashboardData";
import { pageTotal } from "@/shared/lib";

const RENK = ["success", "accent", "warning", "notr"] as const;

type Props = { root: "/mudur" | "/bashekim" };

export function YonetimDashboardOzetTab({ root }: Props) {
  const {
    loading,
    personelPage,
    doktorPage,
    departmanlar,
    bugunRandevu,
    sikayetPage,
    acikTemizlik,
    hastaPage,
  } = useYonetimDashboardData(root);

  const metrics = [
    {
      label: "Personel",
      value: loading ? "…" : pageTotal(personelPage.data ?? []),
      icon: IdCard,
      to: `${root}/personel`,
    },
    {
      label: "Doktor",
      value: loading ? "…" : pageTotal(doktorPage.data ?? []),
      icon: Stethoscope,
      to: `${root}/doktorlar`,
    },
    {
      label: "Departman",
      value: loading ? "…" : (departmanlar.data?.length ?? 0),
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
      value: loading ? "…" : pageTotal(hastaPage.data ?? []),
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
      value: loading ? "…" : pageTotal(sikayetPage.data ?? []),
      icon: MessageSquareWarning,
      to: `${root}/sikayet`,
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
