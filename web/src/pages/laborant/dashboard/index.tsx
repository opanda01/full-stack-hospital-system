import {
  Building2,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type LaborantOzet = {
  bekleyen_tetkik: number;
  bugun_tamamlanan: number;
  sonuc_girisi_bekleyen: number;
  toplam_tetkik: number;
};

export function LaborantDashboardPage() {
  const { data: ozet } = useQuery({
    queryKey: ["dashboard-laborant-ozet"],
    queryFn: async () =>
      (await api.get<LaborantOzet>("/dashboard/laborant/ozet")).data,
  });

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Bekleyen tetkik",
          value: ozet?.bekleyen_tetkik ?? "…",
          icon: ClipboardList,
          to: "/laborant/bekleyen",
        },
        {
          label: "Bugün tamamlanan",
          value: ozet?.bugun_tamamlanan ?? "…",
          icon: FileText,
        },
        {
          label: "Sonuç girişi bekleyen",
          value: ozet?.sonuc_girisi_bekleyen ?? "…",
          icon: Users,
          to: "/laborant/tetkik-sonuc-girisi",
        },
        {
          label: "Toplam tetkik",
          value: ozet?.toplam_tetkik ?? "…",
          icon: Building2,
        },
      ]}
    />
  );
}
