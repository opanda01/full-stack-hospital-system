import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Epikriz = {
  id: number;
  yatis_id: number;
  hasta_id: number;
  durum: string;
  sikayet_oyku: string | null;
  fizik_muayene: string | null;
  tani: string | null;
  tedavi_ozeti: string | null;
  taburcu_onerileri: string | null;
};
type Yatis = { id: number; protokol_no: string; hasta_ad_soyad: string; hasta_id: number };

export function HemsireEpikrizPage() {
  const qc = useQueryClient();
  const [yatisId, setYatisId] = useState("");
  const [sikayet, setSikayet] = useState("");
  const [fizik, setFizik] = useState("");
  const [tani, setTani] = useState("");
  const [tedavi, setTedavi] = useState("");
  const [taburcu, setTaburcu] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: liste = [], isLoading, isError, error } = useQuery({
    queryKey: ["epikriz"],
    queryFn: async () => (await api.get<Epikriz[]>("/epikriz/")).data,
  });
  const { data: yatislar = [] } = useQuery({
    queryKey: ["yatis-aktif-epikriz"],
    queryFn: async () =>
      (
        await api.get<Yatis[]>("/yatis/kayitlar", {
          params: { aktif: true, kapsam: "benim" },
        })
      ).data,
  });

  const yatisLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const y of yatislar) {
      m.set(y.id, `${y.protokol_no} — ${y.hasta_ad_soyad}`);
    }
    return m;
  }, [yatislar]);

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/epikriz/", {
        yatis_id: Number(yatisId),
        sikayet_oyku: sikayet || null,
        fizik_muayene: fizik || null,
        tani: tani || null,
        tedavi_ozeti: tedavi || null,
        taburcu_onerileri: taburcu || null,
      }),
    onSuccess: () => {
      setErr(null);
      setSikayet("");
      setFizik("");
      setTani("");
      setTedavi("");
      setTaburcu("");
      qc.invalidateQueries({ queryKey: ["epikriz"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Epikriz</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Yatış özeti taslağı oluşturun; doktor onayı sonrası kilitlenir.
        </p>
      </div>

      <form
        className="grid max-w-2xl gap-3 rounded border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <label className="text-sm">
          Yatış
          <select
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={yatisId}
            onChange={(e) => setYatisId(e.target.value)}
            required
          >
            <option value="">Seçin…</option>
            {yatislar.map((y) => (
              <option key={y.id} value={y.id}>
                {y.protokol_no} — {y.hasta_ad_soyad}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Şikayet / öykü
          <textarea
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            rows={2}
            value={sikayet}
            onChange={(e) => setSikayet(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Fizik muayene
          <textarea
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            rows={2}
            value={fizik}
            onChange={(e) => setFizik(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Tanı
          <Input value={tani} onChange={(e) => setTani(e.target.value)} />
        </label>
        <label className="text-sm">
          Tedavi özeti
          <textarea
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            rows={2}
            value={tedavi}
            onChange={(e) => setTedavi(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Taburcu önerileri
          <Input value={taburcu} onChange={(e) => setTaburcu(e.target.value)} />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit" disabled={createMut.isPending || !yatisId}>
          Taslak kaydet
        </Button>
      </form>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <ul className="space-y-2">
          {liste.map((e) => (
            <li key={e.id} className="rounded border bg-card px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  #{e.id} — {yatisLabel.get(e.yatis_id) ?? `Yatış #${e.yatis_id}`}
                </span>
                <span
                  className={
                    e.durum === "ONAYLANDI"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }
                >
                  {e.durum}
                </span>
              </div>
              {e.tani && <p className="mt-1 text-muted-foreground">Tanı: {e.tani}</p>}
              <Link
                className="mt-1 inline-block text-xs text-primary underline"
                to={`/hemsire/servis-takip`}
              >
                Servis takip
              </Link>
            </li>
          ))}
          {!liste.length && (
            <li className="text-sm text-muted-foreground">Epikriz yok.</li>
          )}
        </ul>
      )}
    </div>
  );
}
