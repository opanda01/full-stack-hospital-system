import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { useRoleBasePath } from "@/shared/auth";
import { getApiErrorMessage } from "@/shared/lib";

type Tetkik = {
  id: number;
  hasta_id: number;
  tetkik_turu: string;
  sonuc_dosyasi: string | null;
  durum: string;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null };

export function HemsireTetkiklerPage() {
  const base = useRoleBasePath();
  const [params] = useSearchParams();
  const [durumFiltre, setDurumFiltre] = useState("");
  const [arama, setArama] = useState("");
  const hastaParam = params.get("hasta_id");

  const { data: tetkikler = [], isLoading, isError, error } = useQuery({
    queryKey: ["hemsire-tetkikler", hastaParam],
    queryFn: async () =>
      (
        await api.get<Tetkik[]>("/tetkikler/", {
          params: hastaParam ? { hasta_id: Number(hastaParam) } : undefined,
        })
      ).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-yatan"],
    queryFn: async () =>
      (await api.get<Hasta[]>("/hastalar/", { params: { kapsam: "yatan" } })).data,
  });

  const hastaLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of hastalar) {
      m.set(h.id, `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const filtered = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return tetkikler.filter((t) => {
      if (durumFiltre && t.durum !== durumFiltre) return false;
      if (!q) return true;
      const ad = (hastaLabel.get(t.hasta_id) ?? "").toLowerCase();
      return ad.includes(q) || t.tetkik_turu.toLowerCase().includes(q);
    });
  }, [tetkikler, durumFiltre, arama, hastaLabel]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tetkikler</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Servis hastalarına ait tetkik istekleri (salt okunur)
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Hasta / tetkik ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          <option value="">Tüm durumlar</option>
          <option value="ISTEK_ALINDI">İstek alındı</option>
          <option value="SONUCLANDI">Sonuçlandı</option>
        </select>
      </div>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-3 py-2">Hasta</th>
                <th className="px-3 py-2">Tetkik</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">Sonuç</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="px-3 py-2">
                    <Link
                      className="underline"
                      to={`${base}/hasta-arama?q=${t.hasta_id}`}
                    >
                      {hastaLabel.get(t.hasta_id) ?? `#${t.hasta_id}`}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{t.tetkik_turu}</td>
                  <td className="px-3 py-2">{t.durum}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t.sonuc_dosyasi ?? "—"}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-muted-foreground">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
