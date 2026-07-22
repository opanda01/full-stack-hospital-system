import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type Randevu = { id: number; durum: string; tarih_saat: string };
type Tetkik = { id: number; durum: string };
type KlinikOnay = { id: number; onay_durumu: string };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DoktorDashboardPage() {
  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: tetkikler = [] } = useQuery({
    queryKey: ["tetkikler"],
    queryFn: async () => (await api.get<Tetkik[]>("/tetkikler/")).data,
  });
  const { data: klinik = [] } = useQuery({
    queryKey: ["klinik-onay"],
    queryFn: async () => (await api.get<KlinikOnay[]>("/klinik-onay/")).data,
  });

  const metrics = useMemo(() => {
    const bugun = startOfDay(new Date());
    const yarin = new Date(bugun);
    yarin.setDate(yarin.getDate() + 1);
    const bugunku = randevular.filter((r) => {
      const t = new Date(r.tarih_saat).getTime();
      return t >= bugun.getTime() && t < yarin.getTime() && r.durum !== "IPTAL";
    }).length;
    const bekleyenMuayene = randevular.filter(
      (r) => r.durum === "BEKLEMEDE",
    ).length;
    const tamamlanan = randevular.filter((r) => r.durum === "TAMAMLANDI").length;
    const bekleyenTetkik = tetkikler.filter((t) => t.durum !== "SONUCLANDI").length;
    const bekleyenOnay = klinik.filter((k) => k.onay_durumu === "BEKLEMEDE").length;
    return [
      {
        label: "Bugünkü randevu",
        value: bugunku,
        icon: CalendarClock,
        to: "/doktor/randevularim",
      },
      {
        label: "Bekleyen muayene",
        value: bekleyenMuayene,
        icon: ClipboardList,
        to: "/doktor/muayene",
      },
      {
        label: "Tamamlanan",
        value: tamamlanan,
        icon: CheckCircle2,
      },
      {
        label: "Bekleyen tetkik / onay",
        value: `${bekleyenTetkik} / ${bekleyenOnay}`,
        icon: FlaskConical,
        to: "/doktor/tetkiklerim",
      },
    ];
  }, [randevular, tetkikler, klinik]);

  return <RoleDashboard metrics={metrics} />;
}
