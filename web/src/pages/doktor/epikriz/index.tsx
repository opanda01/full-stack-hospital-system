import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Epikriz = {
  id: number;
  yatis_id: number;
  hasta_id: number;
  durum: string;
  sikayet_oyku: string | null;
  tani: string | null;
  tedavi_ozeti: string | null;
};

export function DoktorEpikrizPage() {
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);

  const { data: liste = [], isLoading, isError, error } = useQuery({
    queryKey: ["doktor-epikriz"],
    queryFn: async () => (await api.get<Epikriz[]>("/epikriz/")).data,
  });

  const onayMut = useMutation({
    mutationFn: async (id: number) => api.post(`/epikriz/${id}/onayla`),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["doktor-epikriz"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const taslaklar = liste.filter((e) => e.durum === "TASLAK");
  const onaylilar = liste.filter((e) => e.durum === "ONAYLANDI");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Epikriz onay</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hemşire taslaklarını inceleyip onaylayın.
        </p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="font-medium">Bekleyen taslaklar</h3>
            {taslaklar.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded border bg-card px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    #{e.id} — Yatış {e.yatis_id} / Hasta {e.hasta_id}
                  </p>
                  {e.tani && <p className="text-muted-foreground">Tanı: {e.tani}</p>}
                  {e.sikayet_oyku && (
                    <p className="text-muted-foreground line-clamp-2">{e.sikayet_oyku}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => onayMut.mutate(e.id)}
                  disabled={onayMut.isPending}
                >
                  Onayla
                </Button>
              </div>
            ))}
            {!taslaklar.length && (
              <p className="text-sm text-muted-foreground">Bekleyen taslak yok.</p>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Onaylı ({onaylilar.length})</h3>
            {onaylilar.slice(0, 10).map((e) => (
              <div key={e.id} className="rounded border px-3 py-2 text-sm text-muted-foreground">
                #{e.id} — Yatış {e.yatis_id} — {e.tani ?? "—"}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
