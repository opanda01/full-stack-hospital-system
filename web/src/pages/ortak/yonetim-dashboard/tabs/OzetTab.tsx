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
import { renkEnvanter, renkKuyrukSayaci, renkNavigasyon } from "@/shared/ui/app-shell/metricCardSemantics";
import { useYonetimDashboardData } from "@/features/dashboard/hooks/useYonetimDashboardData";
import { pageTotal } from "@/shared/lib";

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
      variant: "action" as const,
      actionHint: "Çizelgeyi aç",
      value: 0,
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
      {metrics.map((m) => (
        <MetricCard
          key={m.label}
          label={m.label}
          value={m.value}
          icon={m.icon}
          renk={
            m.label === "Nöbet çizelgesi"
              ? renkNavigasyon()
              : typeof m.value === "number" && m.label.includes("temizlik")
                ? renkKuyrukSayaci(m.value as number, loading)
                : typeof m.value === "number" && m.label.includes("randevu")
                  ? renkKuyrukSayaci(m.value as number, loading)
                  : renkEnvanter()
          }
          to={m.to}
          variant={"variant" in m ? m.variant : "stat"}
          actionHint={"actionHint" in m ? m.actionHint : undefined}
        />
      ))}
    </DashboardGrid>
  );
}
