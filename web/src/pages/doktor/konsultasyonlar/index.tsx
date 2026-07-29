import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  getApiErrorMessage,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import {
  DoktorHastaSecimField,
  useDoktorHastaSecim,
} from "@/features/doktor-hasta-secim";

type Konsultasyon = {
  id: number;
  isteyen_doktor_id: number;
  hedef_doktor_id: number;
  hasta_id: string;
  notlar: string | null;
  durum: string;
  yanit_notu: string | null;
};
type Doktor = {
  id: number;
  ad?: string | null;
  soyad?: string | null;
  uzmanlik_alani: string;
  departman_id?: number | null;
};
type Departman = { id: number; ad: string };

export function DoktorKonsultasyonlarPage() {
  const qc = useQueryClient();
  const [hedefDepartmanId, setHedefDepartmanId] = useState("");
  const [hedefId, setHedefId] = useState("");
  const hastaSecim = useDoktorHastaSecim();
  const { hastaId, setHastaId, hastaLabel } = hastaSecim;
  const [notlar, setNotlar] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: ben } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Doktor>>("/doktorlar/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
  const { data: liste = [], isLoading, isError, error } = useQuery({
    queryKey: ["konsultasyonlar"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Konsultasyon>>("/konsultasyonlar/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
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

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/konsultasyonlar/", {
        hedef_doktor_id: Number(hedefId),
        hasta_id: hastaId,
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

  const digerDoktorlar = useMemo(
    () => doktorlar.filter((d) => d.id !== ben?.id),
    [doktorlar, ben?.id],
  );

  const hedefDoktorSecenekleri = useMemo(() => {
    if (!hedefDepartmanId) return [];
    return digerDoktorlar.filter(
      (d) => String(d.departman_id ?? "") === hedefDepartmanId,
    );
  }, [digerDoktorlar, hedefDepartmanId]);

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
        <DoktorHastaSecimField
          hastaModu={hastaSecim.hastaModu}
          onModuChange={hastaSecim.switchModu}
          hastaTarih={hastaSecim.hastaTarih}
          onTarihChange={hastaSecim.changeTarih}
          options={hastaSecim.hastaSecenekleri}
          value={hastaId}
          onChange={setHastaId}
        />
        <select
          className="w-full rounded-md border border-border px-3 py-2"
          value={hedefDepartmanId}
          onChange={(e) => {
            setHedefDepartmanId(e.target.value);
            setHedefId("");
          }}
        >
          <option value="">Hedef departman</option>
          {departmanlar.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ad}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-md border border-border px-3 py-2"
          value={hedefId}
          onChange={(e) => setHedefId(e.target.value)}
          disabled={!hedefDepartmanId}
        >
          <option value="">
            {hedefDepartmanId ? "Hedef doktor" : "Önce departman seçin"}
          </option>
          {hedefDoktorSecenekleri.map((d) => (
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
          disabled={
            !hastaId || !hedefDepartmanId || !hedefId || createMut.isPending
          }
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
