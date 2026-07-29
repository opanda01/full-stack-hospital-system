import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  formatIstanbulDateTime,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { randevuHastaAdi, type Randevu } from "@/entities/randevu";

export function HemsirePanelPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["hemsire-randevular"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
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
              <span className="font-medium">{randevuHastaAdi(r)}</span>
              {" — "}
              {formatIstanbulDateTime(r.tarih_saat)} — {r.durum}
            </li>
          ))}
          {!data.length && <p className="text-muted-foreground">Kayıt yok.</p>}
        </ul>
      )}
    </AppShell>
  );
}
