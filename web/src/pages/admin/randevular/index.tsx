import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { RandevuIptalEtButton } from "@/features/randevu-iptal-et";
import type { Randevu } from "@/entities/randevu";
import type { Doktor } from "@/entities/doktor";

type Hasta = { id: number; tc_kimlik_no: string; kullanici_id: number };
type Kullanici = { id: number; ad: string; soyad: string };
type Departman = { id: number; ad: string };

export function AdminRandevularPage() {
  const {
    data: randevular = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });

  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/")).data,
  });

  const { data: kullanicilar = [] } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const doktorById = useMemo(() => {
    const map = new Map<number, Doktor>();
    for (const d of doktorlar) map.set(d.id, d);
    return map;
  }, [doktorlar]);

  const hastaLabelById = useMemo(() => {
    const kullaniciById = new Map(kullanicilar.map((k) => [k.id, k]));
    const map = new Map<number, string>();
    for (const h of hastalar) {
      const k = kullaniciById.get(h.kullanici_id);
      map.set(
        h.id,
        k ? `${k.ad} ${k.soyad}` : `Hasta #${h.id} (${h.tc_kimlik_no})`,
      );
    }
    return map;
  }, [hastalar, kullanicilar]);

  const departmanById = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of departmanlar) map.set(d.id, d.ad);
    return map;
  }, [departmanlar]);

  return (
    <AppShell title="Randevular" links={[{ to: "/admin", label: "Admin" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : randevular.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz randevu yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Tarih</th>
              <th>Hasta</th>
              <th>Doktor</th>
              <th>Departman</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {randevular.map((r) => {
              const doktor = doktorById.get(r.doktor_id);
              const doktorAd = doktor
                ? `${doktor.ad ?? ""} ${doktor.soyad ?? ""}`.trim() ||
                  doktor.uzmanlik_alani
                : `#${r.doktor_id}`;
              return (
                <tr key={r.id} className="border-b">
                  <td className="py-2">
                    {new Date(r.tarih_saat).toLocaleString("tr-TR")}
                  </td>
                  <td>{hastaLabelById.get(r.hasta_id) ?? `#${r.hasta_id}`}</td>
                  <td>{doktorAd}</td>
                  <td>
                    {departmanById.get(r.departman_id) ?? `#${r.departman_id}`}
                  </td>
                  <td>{r.durum}</td>
                  <td>
                    {r.durum !== "IPTAL" && (
                      <RandevuIptalEtButton randevuId={r.id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
