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
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type YatisListeItem = { id: number };
type Gorev = { id: number; tamamlandi_mi: boolean };
type Randevu = { id: number };
type Nobet = { id: number; tarih: string };
type Tetkik = { id: number; durum: string };
type Mar = { id: number; durum: string };
type Talep = { id: number; durum: string };

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
      (await api.get<Talep[]>("/ilac-talepleri/")).data,
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

  const { data: tetkikler = [] } = useQuery({
    queryKey: ["hemsire-tetkik-dash"],
    queryFn: async () => {
      try {
        return (await api.get<Tetkik[]>("/tetkikler/")).data;
      } catch {
        return [] as Tetkik[];
      }
    },
  });

  const { data: marlar = [] } = useQuery({
    queryKey: ["hemsire-mar-dash"],
    queryFn: async () => {
      try {
        return (
          await api.get<Mar[]>("/yatis/ilac-uygulamalari", {
            params: { durum: "BEKLIYOR", kapsam: "benim" },
          })
        ).data;
      } catch {
        return [] as Mar[];
      }
    },
  });

  const bekleyenIlac = talepler.filter((t) => t.durum === "ONAY_BEKLIYOR").length;
  const bekleyenGorev = gorevler.filter((g) => !g.tamamlandi_mi).length;
  const bekleyenOrder =
    marlar.length +
    tetkikler.filter((t) => t.durum === "ISTEK_ALINDI").length +
    bekleyenIlac;

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
          label: "Bekleyen order",
          value: bekleyenOrder,
          icon: ListOrdered,
          to: "/hemsire/order-takip",
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
