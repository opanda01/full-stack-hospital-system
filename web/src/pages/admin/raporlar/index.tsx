import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Kullanici = { id: number; rol: string; aktif_mi: boolean };
type Doktor = { id: number };
type Departman = { id: number };
type Randevu = { id: number; durum: string };
type Personel = { id: number };

export function AdminRaporlarPage() {
  const {
    data: kullanicilar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: personeller = [] } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  const rolDagilimi = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of kullanicilar) {
      counts.set(u.rol, (counts.get(u.rol) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [kullanicilar]);

  const aktifKullanici = kullanicilar.filter((u) => u.aktif_mi).length;
  const aktifRandevu = randevular.filter((r) => r.durum !== "IPTAL").length;
  const iptalRandevu = randevular.filter((r) => r.durum === "IPTAL").length;

  return (
    <AppShell title="Raporlar" links={[{ to: "/admin", label: "Admin" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OzetKart label="Kullanıcı (aktif)" value={`${aktifKullanici} / ${kullanicilar.length}`} />
            <OzetKart label="Personel" value={personeller.length} />
            <OzetKart label="Doktor" value={doktorlar.length} />
            <OzetKart label="Departman" value={departmanlar.length} />
            <OzetKart label="Randevu (aktif)" value={aktifRandevu} />
            <OzetKart label="Randevu (iptal)" value={iptalRandevu} />
          </div>

          <section>
            <h3 className="mb-3 text-lg font-semibold">Rol dağılımı</h3>
            {rolDagilimi.length === 0 ? (
              <p className="text-sm text-slate-600">Veri yok.</p>
            ) : (
              <table className="w-full max-w-md border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Rol</th>
                    <th>Adet</th>
                  </tr>
                </thead>
                <tbody>
                  {rolDagilimi.map(([rol, adet]) => (
                    <tr key={rol} className="border-b">
                      <td className="py-2">{rol}</td>
                      <td>{adet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function OzetKart({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded border bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
