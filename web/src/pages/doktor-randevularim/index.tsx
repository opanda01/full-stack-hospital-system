import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";

type Randevu = {
  id: number;
  hasta_id: number;
  doktor_id: number;
  departman_id: number;
  tarih_saat: string;
  durum: string;
};

export function DoktorRandevularimPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["randevularim"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });

  return (
    <AppShell
      title="Randevularım"
      links={[
        { to: "/doktor/profil", label: "Profil" },
        { to: "/doktor/muayene", label: "Muayene" },
      ]}
    >
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r.id} className="rounded border bg-white p-3 text-sm">
              #{r.id} — {new Date(r.tarih_saat).toLocaleString("tr-TR")} — {r.durum}{" "}
              (hasta {r.hasta_id})
            </li>
          ))}
          {!data.length && <p className="text-slate-500">Randevu yok.</p>}
        </ul>
      )}
    </AppShell>
  );
}
