import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ListTodo,
  Pill,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type YatisListeItem = { id: number };
type Gorev = { id: number; tamamlandi_mi: boolean };
type Randevu = { id: number };
type Nobet = { id: number; tarih: string };

export function HemsireDashboardPage() {
  const { data: yatislar = [] } = useQuery({
    queryKey: ["yatis-kayitlar-aktif-count"],
    queryFn: async () =>
      (
        await api.get<YatisListeItem[]>("/yatis/kayitlar", {
          params: { aktif: true, kapsam: "benim" },
        })
      ).data,
  });

  const { data: talepler = [] } = useQuery({
    queryKey: ["ilac-talepleri-dashboard"],
    queryFn: async () =>
      (await api.get<{ id: number; durum: string }[]>("/ilac-talepleri/")).data,
  });

  const { data: gorevler = [] } = useQuery({
    queryKey: ["hemsire-gorevler-dash"],
    queryFn: async () =>
      (await api.get<Gorev[]>("/yatis/gorevler", { params: { benim: true } })).data,
  });

  const { data: randevular = [] } = useQuery({
    queryKey: ["hemsire-randevular-dash"],
    queryFn: async () => {
      try {
        return (await api.get<Randevu[]>("/randevular/")).data;
      } catch {
        return [] as Randevu[];
      }
    },
  });

  const { data: nobetler = [] } = useQuery({
    queryKey: ["hemsire-nobet-dash"],
    queryFn: async () => {
      try {
        return (await api.get<Nobet[]>("/nobet-cizelgesi/")).data;
      } catch {
        return [] as Nobet[];
      }
    },
  });

  const bekleyenIlac = talepler.filter((t) => t.durum === "ONAY_BEKLIYOR").length;
  const bekleyenGorev = gorevler.filter((g) => !g.tamamlandi_mi).length;

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Yatan hasta",
          value: yatislar.length,
          icon: Users,
          to: "/hemsire/servis-takip",
        },
        {
          label: "Bekleyen görev",
          value: bekleyenGorev,
          icon: ListTodo,
          to: "/hemsire/gorevler",
        },
        {
          label: "Bekleyen ilaç isteği",
          value: bekleyenIlac,
          icon: ClipboardList,
          to: "/hemsire/ilac-talep",
        },
        {
          label: "İlaç/malzeme talep",
          value: talepler.length,
          icon: Pill,
          to: "/hemsire/ilac-talep",
        },
        {
          label: "Departman randevusu",
          value: randevular.length,
          icon: CalendarClock,
          to: "/hemsire/departman-randevulari",
        },
        {
          label: "Nöbet çizelgesi",
          value: nobetler.length,
          icon: CalendarDays,
          to: "/hemsire/nobet",
        },
      ]}
    />
  );
}
