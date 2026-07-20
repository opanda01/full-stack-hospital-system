import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";

type Randevu = {
  id: number;
  hasta_id: number;
  tarih_saat: string;
  durum: string;
  departman_id: number;
};

export function HemsirePanelPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["hemsire-randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });

  return (
    <AppShell title="Hemşire Paneli">
      <p className="mb-4 text-sm text-slate-600">Departmanınızdaki randevular</p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r.id} className="rounded border bg-white p-3 text-sm">
              #{r.id} — {new Date(r.tarih_saat).toLocaleString("tr-TR")} — {r.durum}
            </li>
          ))}
          {!data.length && <p className="text-slate-500">Kayıt yok.</p>}
        </ul>
      )}
    </AppShell>
  );
}
