import {
  Building2,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type IdariOzet = {
  bugun_hasta_kayit: number;
  bekleyen_randevu: number;
  ozel_kimlik_hasta: number;
  departman_sayisi: number;
};

export function IdariDashboardPage() {
  const { data: ozet } = useQuery({
    queryKey: ["dashboard-idari-ozet"],
    queryFn: async () =>
      (await api.get<IdariOzet>("/dashboard/idari/ozet")).data,
  });

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Bugünkü kayıt",
          value: ozet?.bugun_hasta_kayit ?? "…",
          icon: ClipboardList,
          to: "/idari/hasta-kayit",
        },
        {
          label: "Bekleyen randevu",
          value: ozet?.bekleyen_randevu ?? "…",
          icon: FileText,
        },
        {
          label: "Hasta kayıt (özel kimlik)",
          value: ozet?.ozel_kimlik_hasta ?? "…",
          icon: Users,
          to: "/idari/ozel-kimlik-kayit",
        },
        {
          label: "Departman",
          value: ozet?.departman_sayisi ?? "…",
          icon: Building2,
        },
      ]}
    />
  );
}
