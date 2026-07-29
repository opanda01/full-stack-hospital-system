import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/shared/api";
import {
  getApiErrorMessage,
  unwrapPage,
  type PageResponse,
  LOOKUP_PAGE_SIZE,
} from "@/shared/lib";
import { durumToBadgeVariant } from "@/shared/lib/status-badge";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui";

type Doktor = { id: number };

type YatisListeItem = {
  id: number;
  protokol_no: string;
  hasta_id: string;
  hasta_ad_soyad: string;
  yatak_no: string | null;
  oda_no: string | null;
  yatis_tarihi: string;
  gecen_gun: number;
  klinik_durum: string;
  servis_ad: string | null;
};

type YatisDetay = {
  id: number;
  hasta_id: string;
  protokol_no: string;
  yatis_tarihi: string;
  klinik_durum: string;
  servis_ad: string | null;
  yatak_no: string | null;
  oda_no: string | null;
  hasta_ad_soyad: string;
  yas: number | null;
  cinsiyet: string | null;
  kan_grubu: string | null;
};

type Mar = {
  id: number;
  ilac_adi: string;
  doz: string | null;
  kullanim_sekli: string;
  planlanan_saat: string;
  durum: string;
};

type Tetkik = {
  id: string;
  tetkik_turu: string;
  durum: string;
};

type NotRow = { id: number; metin: string; created_at: string };

type GenelDurum = "STABIL" | "KRITIK" | "IYILESIR";

const GENEL_DURUM_LABEL: Record<GenelDurum, string> = {
  STABIL: "Stabil",
  KRITIK: "Kritik",
  IYILESIR: "İyileşiyor",
};

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString("tr-TR");
}

function yatakOdaLabel(k: Pick<YatisListeItem, "oda_no" | "yatak_no">) {
  if (k.oda_no && k.yatak_no) return `${k.oda_no} / ${k.yatak_no}`;
  return k.yatak_no ?? k.oda_no ?? "—";
}

function klinikBadge(durum: string) {
  return (
    <Badge variant={durumToBadgeVariant(durum)} className="normal-case">
      {durum.replace(/_/g, " ")}
    </Badge>
  );
}

export function DoktorServisimPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [vizitMetin, setVizitMetin] = useState("");
  const [genelDurum, setGenelDurum] = useState<GenelDurum>("STABIL");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });

  const listParams = useMemo(() => {
    const p: Record<string, string> = { aktif: "true", page_size: String(LOOKUP_PAGE_SIZE) };
    if (doktor?.id) p.doktor_id = String(doktor.id);
    return p;
  }, [doktor?.id]);

  const {
    data: kayitlar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["doktor-yatis", listParams],
    enabled: doktor != null,
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<YatisListeItem>>("/yatis/kayitlar", {
            params: listParams,
          })
        ).data,
      ),
  });

  const { data: detay } = useQuery({
    queryKey: ["yatis-detay", selectedId],
    enabled: selectedId != null,
    queryFn: async () =>
      (await api.get<YatisDetay>(`/yatis/kayitlar/${selectedId}`)).data,
  });

  const { data: marlar = [] } = useQuery({
    queryKey: ["yatis-mar", selectedId],
    enabled: selectedId != null,
    queryFn: async () =>
      (await api.get<Mar[]>(`/yatis/kayitlar/${selectedId}/ilac-uygulamalari`))
        .data,
  });

  const { data: tetkikler = [] } = useQuery({
    queryKey: ["yatis-tetkik", detay?.hasta_id],
    enabled: !!detay?.hasta_id,
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Tetkik>>("/tetkikler/", {
            params: { hasta_id: detay!.hasta_id, page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const { data: notlar = [] } = useQuery({
    queryKey: ["yatis-not", selectedId],
    enabled: selectedId != null,
    queryFn: async () =>
      (await api.get<NotRow[]>(`/yatis/kayitlar/${selectedId}/notlar`)).data,
  });

  const notMut = useMutation({
    mutationFn: async () => {
      const tarih = new Date().toLocaleString("tr-TR");
      const metin = `[Günlük vizit · ${tarih}]\nGenel durum: ${GENEL_DURUM_LABEL[genelDurum]}\n${vizitMetin.trim()}`;
      return api.post(`/yatis/kayitlar/${selectedId}/notlar`, { metin });
    },
    onSuccess: () => {
      setMsg("Vizit notu kaydedildi");
      setErr(null);
      setVizitMetin("");
      qc.invalidateQueries({ queryKey: ["yatis-not", selectedId] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Servisim</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorumlu doktoru olduğunuz aktif yatışlar; vizit notu ve order takibi
        </p>
      </div>

      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Yatan hastalarım</h3>
            <p className="text-xs text-muted-foreground">
              {kayitlar.length} aktif kayıt
            </p>
          </div>
          {isLoading ? (
            <p className="p-4 text-sm">Yükleniyor…</p>
          ) : isError ? (
            <p className="p-4 text-sm text-red-600">{getApiErrorMessage(error)}</p>
          ) : kayitlar.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Aktif yatış kaydı yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Oda / Yatak</th>
                    <th className="px-3 py-2">Protokol</th>
                    <th className="px-3 py-2">Hasta</th>
                    <th className="px-3 py-2">Gün</th>
                    <th className="px-3 py-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {kayitlar.map((k) => (
                    <tr
                      key={k.id}
                      className={`cursor-pointer border-b border-border hover:bg-muted/40 ${
                        selectedId === k.id ? "bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        setSelectedId(k.id);
                        setMsg(null);
                        setErr(null);
                      }}
                    >
                      <td className="px-3 py-2">{yatakOdaLabel(k)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{k.protokol_no}</td>
                      <td className="px-3 py-2">{k.hasta_ad_soyad}</td>
                      <td className="px-3 py-2">{k.gecen_gun}</td>
                      <td className="px-3 py-2">{klinikBadge(k.klinik_durum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          {!selectedId || !detay ? (
            <p className="text-sm text-muted-foreground">
              Detay için listeden hasta seçin.
            </p>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold">{detay.hasta_ad_soyad}</h3>
                <p className="text-sm text-muted-foreground">
                  {detay.protokol_no} · {detay.servis_ad ?? "—"} ·{" "}
                  {yatakOdaLabel(detay)} · {klinikBadge(detay.klinik_durum)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yatış: {fmtDate(detay.yatis_tarihi)}
                  {detay.yas != null ? ` · ${detay.yas} yaş` : ""}
                  {detay.cinsiyet ? ` · ${detay.cinsiyet}` : ""}
                  {detay.kan_grubu ? ` · ${detay.kan_grubu}` : ""}
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-sm font-medium">Günlük vizit notu</p>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Genel durum</span>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                    value={genelDurum}
                    onChange={(e) => setGenelDurum(e.target.value as GenelDurum)}
                  >
                    {(Object.keys(GENEL_DURUM_LABEL) as GenelDurum[]).map((k) => (
                      <option key={k} value={k}>
                        {GENEL_DURUM_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  className="min-h-[88px] w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Vizit bulguları, plan…"
                  value={vizitMetin}
                  onChange={(e) => setVizitMetin(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!vizitMetin.trim() || notMut.isPending}
                  onClick={() => notMut.mutate()}
                >
                  Notu kaydet
                </Button>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Order / tedavi</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to={`/doktor/tetkiklerim?hasta=${detay.hasta_id}`}
                      >
                        Tetkik iste
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/doktor/receteler?hasta=${detay.hasta_id}`}>
                        Reçete
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      İlaç uygulamaları (MAR)
                    </p>
                    {marlar.length === 0 ? (
                      <p className="text-muted-foreground">Kayıt yok.</p>
                    ) : (
                      <ul className="space-y-1">
                        {marlar.map((m) => (
                          <li
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-2 py-1"
                          >
                            <span>
                              {m.ilac_adi}
                              {m.doz ? ` · ${m.doz}` : ""} · {m.kullanim_sekli}
                            </span>
                            <Badge variant={durumToBadgeVariant(m.durum)}>
                              {m.durum}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      Tetkikler
                    </p>
                    {tetkikler.length === 0 ? (
                      <p className="text-muted-foreground">Kayıt yok.</p>
                    ) : (
                      <ul className="space-y-1">
                        {tetkikler.map((t) => (
                          <li
                            key={t.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-2 py-1"
                          >
                            <span>{t.tetkik_turu}</span>
                            <Badge variant={durumToBadgeVariant(t.durum)}>
                              {t.durum}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="mb-2 text-sm font-medium">Son notlar</p>
                {notlar.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz not yok.</p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                    {notlar.map((n) => (
                      <li
                        key={n.id}
                        className="rounded border border-border bg-muted/30 px-2 py-1.5"
                      >
                        <p className="text-[10px] text-muted-foreground">
                          {fmtDate(n.created_at)}
                        </p>
                        <p className="whitespace-pre-wrap">{n.metin}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
