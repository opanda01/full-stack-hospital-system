import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Konsultasyon = {
  id: number;
  isteyen_doktor_id: number;
  hedef_doktor_id: number;
  hasta_id: number;
  notlar: string | null;
  durum: string;
  yanit_notu: string | null;
};
type Doktor = {
  id: number;
  ad?: string | null;
  soyad?: string | null;
  uzmanlik_alani: string;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null };

export function DoktorKonsultasyonlarPage() {
  const qc = useQueryClient();
  const [hedefId, setHedefId] = useState("");
  const [hastaId, setHastaId] = useState("");
  const [notlar, setNotlar] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: ben } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/benim")).data,
  });
  const { data: liste = [], isLoading, isError, error } = useQuery({
    queryKey: ["konsultasyonlar"],
    queryFn: async () =>
      (await api.get<Konsultasyon[]>("/konsultasyonlar/")).data,
  });

  const doktorLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of doktorlar) {
      m.set(
        d.id,
        `${d.ad ?? ""} ${d.soyad ?? ""}`.trim() || d.uzmanlik_alani || `#${d.id}`,
      );
    }
    return m;
  }, [doktorlar]);

  const hastaLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of hastalar) {
      m.set(h.id, `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/konsultasyonlar/", {
        hedef_doktor_id: Number(hedefId),
        hasta_id: Number(hastaId),
        notlar: notlar || null,
      }),
    onSuccess: () => {
      setErr(null);
      setNotlar("");
      qc.invalidateQueries({ queryKey: ["konsultasyonlar"] });
      qc.invalidateQueries({ queryKey: ["hastalar-benim"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const yanitMut = useMutation({
    mutationFn: async ({ id, kabul }: { id: number; kabul: boolean }) =>
      api.post(`/konsultasyonlar/${id}/yanitla`, { kabul }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["konsultasyonlar"] });
      qc.invalidateQueries({ queryKey: ["hastalar-benim"] });
    },
  });

  const digerDoktorlar = doktorlar.filter((d) => d.id !== ben?.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Konsültasyonlar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kabul edilen konsültasyon ilgili hastaya erişim açar
        </p>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Yeni istek</h3>
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}
        <select
          className="w-full rounded-md border border-border px-3 py-2"
          value={hastaId}
          onChange={(e) => setHastaId(e.target.value)}
        >
          <option value="">Hasta</option>
          {hastalar.map((h) => (
            <option key={h.id} value={h.id}>
              {hastaLabel.get(h.id)}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-md border border-border px-3 py-2"
          value={hedefId}
          onChange={(e) => setHedefId(e.target.value)}
        >
          <option value="">Hedef doktor</option>
          {digerDoktorlar.map((d) => (
            <option key={d.id} value={d.id}>
              {doktorLabel.get(d.id)}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded-md border border-border px-3 py-2"
          placeholder="Not"
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
        />
        <Button
          type="button"
          disabled={!hastaId || !hedefId || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          İstek gönder
        </Button>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <ul className="space-y-2">
          {liste.map((k) => {
            const hedefBen = ben && k.hedef_doktor_id === ben.id;
            return (
              <li key={k.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="font-medium">
                  {k.durum} · Hasta:{" "}
                  {hastaLabel.get(k.hasta_id) ?? `#${k.hasta_id}`}
                </div>
                <p className="mt-1 text-muted-foreground">
                  {doktorLabel.get(k.isteyen_doktor_id)} →{" "}
                  {doktorLabel.get(k.hedef_doktor_id)}
                  {k.notlar ? ` · ${k.notlar}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link className="underline" to="/doktor/hastalarim">
                    Hastalarım
                  </Link>
                  {hedefBen && k.durum === "BEKLEMEDE" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => yanitMut.mutate({ id: k.id, kabul: true })}
                      >
                        Kabul
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => yanitMut.mutate({ id: k.id, kabul: false })}
                      >
                        Red
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
          {liste.length === 0 && (
            <li className="text-sm text-muted-foreground">Konsültasyon yok.</li>
          )}
        </ul>
      )}
    </div>
  );
}
