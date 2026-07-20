import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";

export function AdminDashboardPage() {
  const { data: randevular } = useQuery({
    queryKey: ["randevular-count"],
    queryFn: async () => {
      const { data } = await api.get("/randevular/");
      return data as unknown[];
    },
  });
  const { data: departmanlar } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => {
      const { data } = await api.get("/departmanlar/");
      return data as unknown[];
    },
  });

  return (
    <AppShell
      title="Yönetim Paneli"
      links={[
        { to: "/departmanlar", label: "Departmanlar" },
        { to: "/personel", label: "Personel" },
        { to: "/hasta-kayit", label: "Hasta kayıt" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Aktif randevu" value={randevular?.length ?? "—"} />
        <Kpi label="Departman" value={departmanlar?.length ?? "—"} />
        <Kpi label="Yatak kapasitesi (profil)" value="545" />
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Çanakkale Mehmet Akif Ersoy Devlet Hastanesi — yönetim özeti.
      </p>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
