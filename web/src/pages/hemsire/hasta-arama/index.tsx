import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Hasta = {
  id: number;
  tc_kimlik_no: string;
  ad?: string | null;
  soyad?: string | null;
  cinsiyet?: string | null;
  kan_grubu?: string | null;
  dogum_tarihi?: string | null;
  adres?: string | null;
};
type Yatis = {
  id: number;
  hasta_id: number;
  protokol_no: string;
  aktif_mi?: boolean;
};

export function HemsireHastaAramaPage() {
  const [q, setQ] = useState("");
  const [kapsam, setKapsam] = useState<"yatan" | "tumu">("yatan");
  const [submitted, setSubmitted] = useState({ q: "", kapsam: "yatan" as "yatan" | "tumu" });
  const [secili, setSecili] = useState<Hasta | null>(null);

  const { data = [], isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["hasta-arama", submitted.q, submitted.kapsam],
    queryFn: async () =>
      (
        await api.get<Hasta[]>("/hastalar/", {
          params: {
            q: submitted.q || undefined,
            kapsam: submitted.kapsam,
          },
        })
      ).data,
  });

  const { data: yatislar = [] } = useQuery({
    queryKey: ["yatis-for-arama"],
    queryFn: async () =>
      (
        await api.get<Yatis[]>("/yatis/kayitlar", {
          params: { aktif: true, kapsam: "benim" },
        })
      ).data,
  });

  const aktifYatis = useMemo(() => {
    if (!secili) return null;
    return yatislar.find((y) => y.hasta_id === secili.id) ?? null;
  }, [secili, yatislar]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Hasta Arama</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ad, TC veya protokol ile arayın
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted({ q, kapsam });
          setSecili(null);
        }}
      >
        <label className="text-sm">
          Arama
          <Input
            className="mt-1 min-w-[220px]"
            placeholder="Ad / TC / protokol"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Kapsam
          <select
            className="mt-1 block rounded border px-2 py-1.5"
            value={kapsam}
            onChange={(e) => setKapsam(e.target.value as "yatan" | "tumu")}
          >
            <option value="yatan">Yatan</option>
            <option value="tumu">Tümü (departman)</option>
          </select>
        </label>
        <Button type="submit">Ara</Button>
      </form>

      {isLoading || isFetching ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="space-y-1 rounded border">
            {data.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                    secili?.id === h.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSecili(h)}
                >
                  {h.ad} {h.soyad} — {h.tc_kimlik_no}
                </button>
              </li>
            ))}
            {!data.length && (
              <li className="px-3 py-4 text-sm text-muted-foreground">Sonuç yok.</li>
            )}
          </ul>
          {secili && (
            <div className="space-y-3 rounded border bg-card p-4 text-sm">
              <h3 className="text-lg font-medium">
                {secili.ad} {secili.soyad}
              </h3>
              <p>TC: {secili.tc_kimlik_no}</p>
              <p>Cinsiyet: {secili.cinsiyet ?? "—"}</p>
              <p>Kan grubu: {secili.kan_grubu ?? "—"}</p>
              <p>Doğum: {secili.dogum_tarihi ?? "—"}</p>
              <p>Adres: {secili.adres ?? "—"}</p>
              {aktifYatis ? (
                <p>
                  Aktif yatış: {aktifYatis.protokol_no}{" "}
                  <Link className="underline" to="/hemsire/servis-takip">
                    Servis takip
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">Aktif yatış yok (kendi servis)</p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/hemsire/tetkikler?hasta_id=${secili.id}`}>Tetkikler</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/hemsire/epikriz">Epikriz</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
