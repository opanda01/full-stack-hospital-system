import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Package,
  Shield,
  UserRound,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type GuvenlikOzet = {
  aktif_vardiya: number;
  acik_olay: number;
  bugun_cozulen: number;
  nobet_saati: string | null;
  acik_ziyaretci: number;
  bekleyen_kayip_esya: number;
};

export function GuvenlikDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["guvenlik-ozet"],
    queryFn: async () => (await api.get<GuvenlikOzet>("/guvenlik/ozet")).data,
  });

  if (isLoading && !data) {
    return <p className="text-sm text-muted-foreground">Özet yükleniyor…</p>;
  }

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Aktif vardiya",
          value: data?.aktif_vardiya ?? 0,
          icon: Shield,
          to: "/guvenlik/nobet",
        },
        {
          label: "Açık olay",
          value: data?.acik_olay ?? 0,
          icon: AlertTriangle,
          to: "/guvenlik/olaylar",
        },
        {
          label: "Bugün çözülen",
          value: data?.bugun_cozulen ?? 0,
          icon: CheckCircle2,
          to: "/guvenlik/olaylar",
        },
        {
          label: "Nöbet saati",
          value: data?.nobet_saati ?? "—",
          icon: Clock3,
          to: "/guvenlik/nobet",
        },
        {
          label: "Açık ziyaretçi",
          value: data?.acik_ziyaretci ?? 0,
          icon: UserRound,
          to: "/guvenlik/ziyaretciler",
        },
        {
          label: "Bekleyen kayıp eşya",
          value: data?.bekleyen_kayip_esya ?? 0,
          icon: Package,
          to: "/guvenlik/kayip-esya",
        },
      ]}
    />
  );
}
