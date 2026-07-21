import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  Stethoscope,
  Users,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { api } from "@/shared/api";

type Kullanici = { id: number };
type Doktor = { id: number };
type Departman = { id: number };
type Randevu = { id: number; tarih_saat: string; durum: string };

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function AdminDashboardPage() {
  const { data: kullanicilar = [], isLoading: l1 } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });
  const { data: doktorlar = [], isLoading: l2 } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });
  const { data: departmanlar = [], isLoading: l3 } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: randevular = [], isLoading: l4 } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });

  const loading = l1 || l2 || l3 || l4;
  const bugunRandevu = randevular.filter(
    (r) => r.durum !== "IPTAL" && isToday(r.tarih_saat),
  ).length;

  return (
    <RoleDashboard
      metrics={[
        {
          label: "Toplam kullanıcı",
          value: loading ? "…" : kullanicilar.length,
          icon: Users,
        },
        {
          label: "Aktif doktor",
          value: loading ? "…" : doktorlar.length,
          icon: Stethoscope,
        },
        {
          label: "Departman",
          value: loading ? "…" : departmanlar.length,
          icon: Building2,
        },
        {
          label: "Bugünkü randevu",
          value: loading ? "…" : bugunRandevu,
          icon: CalendarClock,
        },
      ]}
    />
  );
}
