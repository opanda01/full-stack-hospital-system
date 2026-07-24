import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ListOrdered,
  ListTodo,
  Pill,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRoleBasePath } from "@/shared/auth";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type HemsireOzet = {
  aktif_yatis: number;
  bekleyen_ilac_talep: number;
  bekleyen_gorev: number;
  bekleyen_order: number;
  randevu_sayisi: number;
  nobet_bugun: number;
};

export function HemsireDashboardPage() {
  const base = useRoleBasePath();

  const { data: ozet } = useQuery({
    queryKey: ["dashboard-hemsire-ozet"],
    queryFn: async () =>
      (await api.get<HemsireOzet>("/dashboard/hemsire/ozet")).data,
  });

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Yatan hasta",
          value: ozet?.aktif_yatis ?? "…",
          icon: Users,
          to: `${base}/servis-takip`,
        },
        {
          label: "Bekleyen order",
          value: ozet?.bekleyen_order ?? "…",
          icon: ListOrdered,
          to: `${base}/order-takip`,
        },
        {
          label: "Bekleyen görev",
          value: ozet?.bekleyen_gorev ?? "…",
          icon: ListTodo,
          to: `${base}/gorevler`,
        },
        {
          label: "Bekleyen ilaç isteği",
          value: ozet?.bekleyen_ilac_talep ?? "…",
          icon: ClipboardList,
          to: `${base}/ilac-talep`,
        },
        {
          label: "İlaç/malzeme talep",
          value: ozet?.bekleyen_ilac_talep ?? "…",
          icon: Pill,
          to: `${base}/ilac-talep`,
        },
        {
          label: "Departman randevusu",
          value: ozet?.randevu_sayisi ?? "…",
          icon: CalendarClock,
          to: `${base}/departman-randevulari`,
        },
        {
          label: "Nöbet çizelgesi",
          value: ozet?.nobet_bugun ?? "…",
          icon: CalendarDays,
          to: `${base}/nobet`,
        },
      ]}
    />
  );
}
