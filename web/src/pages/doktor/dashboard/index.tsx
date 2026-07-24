import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type DoktorOzet = {
  bugun_randevu: number;
  bekleyen_muayene: number;
  tamamlanan: number;
  bekleyen_tetkik: number;
  bekleyen_onay: number;
};

export function DoktorDashboardPage() {
  const { data: ozet } = useQuery({
    queryKey: ["dashboard-doktor-ozet"],
    queryFn: async () => (await api.get<DoktorOzet>("/dashboard/doktor/ozet")).data,
  });

  const metrics = [
    {
      label: "Bugünkü randevu",
      value: ozet?.bugun_randevu ?? "…",
      icon: CalendarClock,
      to: "/doktor/randevularim",
    },
    {
      label: "Bekleyen muayene",
      value: ozet?.bekleyen_muayene ?? "…",
      icon: ClipboardList,
      to: "/doktor/muayene",
    },
    {
      label: "Tamamlanan",
      value: ozet?.tamamlanan ?? "…",
      icon: CheckCircle2,
    },
    {
      label: "Bekleyen tetkik / onay",
      value:
        ozet != null
          ? `${ozet.bekleyen_tetkik} / ${ozet.bekleyen_onay}`
          : "…",
      icon: FlaskConical,
      to: "/doktor/tetkiklerim",
    },
  ];

  return <RoleDashboard metrics={metrics} />;
}
