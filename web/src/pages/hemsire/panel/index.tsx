import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulDateTime, unwrapPage, type PageResponse } from "@/shared/lib";

type Randevu = {
  id: string;
  hasta_id: string;
  tarih_saat: string;
  durum: string;
  departman_id: number;
};

export function HemsirePanelPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["hemsire-randevular"],
    queryFn: async () =>
      unwrapPage((await api.get<PageResponse<Randevu>>("/randevular/")).data),
  });

  return (
    <AppShell
      title="Hemşire Paneli"
      links={[
        { to: "/nobet", label: "Nöbetlerim" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Departmanınızdaki randevular
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r.id} className="rounded border bg-card p-3 text-sm">
              #{r.id} — {formatIstanbulDateTime(r.tarih_saat)} — {r.durum}
            </li>
          ))}
          {!data.length && <p className="text-muted-foreground">Kayıt yok.</p>}
        </ul>
      )}
    </AppShell>
  );
}
