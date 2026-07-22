import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@/shared/ui";

type Servis = { id: number; ad: string };
type Yatak = {
  id: number;
  servis_id: number;
  oda_no: string;
  yatak_no: string;
  dolu_mu: boolean;
};
type Doktor = { id: number; uzmanlik_alani?: string };
type YatisListeItem = {
  id: number;
  protokol_no: string;
  hasta_id: number;
  hasta_ad_soyad: string;
  yas: number | null;
  cinsiyet: string | null;
  yatak_no: string | null;
  oda_no: string | null;
  yatis_tarihi: string;
  gecen_gun: number;
  sorumlu_doktor_id: number | null;
  sorumlu_doktor_ad: string | null;
  klinik_durum: string;
  kontrol_edildi_mi: boolean;
  servis_id: number;
  servis_ad: string | null;
};
type YatisDetay = {
  id: number;
  hasta_id: number;
  protokol_no: string;
  basvuru_no: string | null;
  dosya_no: string | null;
  muracaat_tarihi: string | null;
  yatis_tarihi: string;
  cikis_tarihi: string | null;
  sigorta_turu: string | null;
  klinik_durum: string;
  kontrol_edildi_mi: boolean;
  servis_ad: string | null;
  yatak_no: string | null;
  oda_no: string | null;
  sorumlu_doktor_id: number | null;
  sorumlu_doktor_ad: string | null;
  hasta_ad_soyad: string;
  adres: string | null;
  kan_grubu: string | null;
  dogum_tarihi: string | null;
  yas: number | null;
  cinsiyet: string | null;
  bakiye: string | number;
};
type Vital = {
  id: number;
  olcum_zamani: string;
  tansiyon_sistolik: number | null;
  tansiyon_diastolik: number | null;
  nabiz: number | null;
  ates: number | null;
  solunum: number | null;
  spo2: number | null;
  agri_skoru: number | null;
  notlar: string | null;
};
type Mar = {
  id: number;
  ilac_adi: string;
  doz: string | null;
  kullanim_sekli: string;
  planlanan_saat: string;
  durum: string;
  uygulayan_hemsire_id: number | null;
  uygulandi_at: string | null;
};
type NotRow = { id: number; metin: string; yazar_id: number; created_at: string };

type DetayTab = "vital" | "mar" | "servis" | "konsultasyon" | "notlar";
type IslemDialog = { tip: "NAKIL" } | { tip: "IZIN" } | { tip: "DOKTOR_DEGISTIR" } | null;

function rowClass(durum: string) {
  if (durum === "ACIL" || durum === "KRITIK") return "bg-red-50 hover:bg-red-100";
  if (durum === "BEKLEYEN_TETKIK") return "bg-amber-50 hover:bg-amber-100";
  return "hover:bg-muted/40";
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString("tr-TR");
}

export function HemsireServisTakipPage() {
  const qc = useQueryClient();
  const [kapsamBenim, setKapsamBenim] = useState(true);
  const [servisId, setServisId] = useState("");
  const [doktorId, setDoktorId] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<DetayTab>("vital");
  const [dialog, setDialog] = useState<IslemDialog>(null);
  const [confirmTaburcu, setConfirmTaburcu] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [nakilServis, setNakilServis] = useState("");
  const [nakilYatak, setNakilYatak] = useState("");
  const [izinAciklama, setIzinAciklama] = useState("");
  const [yeniDoktor, setYeniDoktor] = useState("");

  const [vitalForm, setVitalForm] = useState({
    tansiyon_sistolik: "",
    tansiyon_diastolik: "",
    nabiz: "",
    ates: "",
    solunum: "",
    spo2: "",
    agri_skoru: "",
    notlar: "",
  });
  const [notMetin, setNotMetin] = useState("");

  const { data: servisler = [] } = useQuery({
    queryKey: ["yatis-servisler"],
    queryFn: async () => (await api.get<Servis[]>("/yatis/servisler")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

  const listParams = useMemo(() => {
    const p: Record<string, string> = { aktif: "true" };
    if (kapsamBenim) p.kapsam = "benim";
    if (servisId) p.servis_id = servisId;
    if (doktorId) p.doktor_id = doktorId;
    if (baslangic) p.baslangic = baslangic;
    if (bitis) p.bitis = bitis;
    return p;
  }, [kapsamBenim, servisId, doktorId, baslangic, bitis]);

  const {
    data: kayitlar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["yatis-kayitlar", listParams],
    queryFn: async () =>
      (await api.get<YatisListeItem[]>("/yatis/kayitlar", { params: listParams })).data,
  });

  const { data: detay } = useQuery({
    queryKey: ["yatis-detay", selectedId],
    enabled: selectedId != null,
    queryFn: async () =>
      (await api.get<YatisDetay>(`/yatis/kayitlar/${selectedId}`)).data,
  });

  const { data: vitaller = [] } = useQuery({
    queryKey: ["yatis-vital", selectedId],
    enabled: selectedId != null && tab === "vital",
    queryFn: async () =>
      (await api.get<Vital[]>(`/yatis/kayitlar/${selectedId}/vitaller`)).data,
  });

  const { data: marlar = [] } = useQuery({
    queryKey: ["yatis-mar", selectedId],
    enabled: selectedId != null && tab === "mar",
    queryFn: async () =>
      (
        await api.get<Mar[]>(`/yatis/kayitlar/${selectedId}/ilac-uygulamalari`)
      ).data,
  });

  const { data: servisHareket = [] } = useQuery({
    queryKey: ["yatis-servis-h", selectedId],
    enabled: selectedId != null && tab === "servis",
    queryFn: async () =>
      (
        await api.get<Record<string, unknown>[]>(
          `/yatis/kayitlar/${selectedId}/servis-hareketleri`,
        )
      ).data,
  });

  const { data: konsultasyonlar = [] } = useQuery({
    queryKey: ["yatis-kons", selectedId],
    enabled: selectedId != null && tab === "konsultasyon",
    queryFn: async () =>
      (
        await api.get<Record<string, unknown>[]>(
          `/yatis/kayitlar/${selectedId}/konsultasyonlar`,
        )
      ).data,
  });

  const { data: notlar = [] } = useQuery({
    queryKey: ["yatis-not", selectedId],
    enabled: selectedId != null && tab === "notlar",
    queryFn: async () =>
      (await api.get<NotRow[]>(`/yatis/kayitlar/${selectedId}/notlar`)).data,
  });

  const { data: yataklar = [] } = useQuery({
    queryKey: ["yatis-yataklar", nakilServis],
    enabled: dialog?.tip === "NAKIL",
    queryFn: async () =>
      (
        await api.get<Yatak[]>("/yatis/yataklar", {
          params: nakilServis ? { servis_id: nakilServis } : undefined,
        })
      ).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["yatis-kayitlar"] });
    qc.invalidateQueries({ queryKey: ["yatis-detay", selectedId] });
    qc.invalidateQueries({ queryKey: ["yatis-vital", selectedId] });
    qc.invalidateQueries({ queryKey: ["yatis-mar", selectedId] });
    qc.invalidateQueries({ queryKey: ["yatis-not", selectedId] });
    qc.invalidateQueries({ queryKey: ["yatis-servis-h", selectedId] });
  };

  const islemMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      api.post(`/yatis/kayitlar/${selectedId}/islemler`, body),
    onSuccess: () => {
      setMsg("İşlem kaydedildi");
      setErr(null);
      setDialog(null);
      setConfirmTaburcu(false);
      invalidate();
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const vitalMut = useMutation({
    mutationFn: async () =>
      api.post(`/yatis/kayitlar/${selectedId}/vitaller`, {
        tansiyon_sistolik: vitalForm.tansiyon_sistolik
          ? Number(vitalForm.tansiyon_sistolik)
          : null,
        tansiyon_diastolik: vitalForm.tansiyon_diastolik
          ? Number(vitalForm.tansiyon_diastolik)
          : null,
        nabiz: vitalForm.nabiz ? Number(vitalForm.nabiz) : null,
        ates: vitalForm.ates ? Number(vitalForm.ates) : null,
        solunum: vitalForm.solunum ? Number(vitalForm.solunum) : null,
        spo2: vitalForm.spo2 ? Number(vitalForm.spo2) : null,
        agri_skoru: vitalForm.agri_skoru ? Number(vitalForm.agri_skoru) : null,
        notlar: vitalForm.notlar || null,
      }),
    onSuccess: () => {
      setMsg("Vital kaydedildi");
      setVitalForm({
        tansiyon_sistolik: "",
        tansiyon_diastolik: "",
        nabiz: "",
        ates: "",
        solunum: "",
        spo2: "",
        agri_skoru: "",
        notlar: "",
      });
      invalidate();
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const marMut = useMutation({
    mutationFn: async ({ id, durum }: { id: number; durum: string }) =>
      api.patch(`/yatis/ilac-uygulamalari/${id}/durum`, { durum }),
    onSuccess: () => {
      setMsg("Uygulama durumu güncellendi");
      qc.invalidateQueries({ queryKey: ["yatis-mar", selectedId] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const notMut = useMutation({
    mutationFn: async () =>
      api.post(`/yatis/kayitlar/${selectedId}/notlar`, { metin: notMetin }),
    onSuccess: () => {
      setNotMetin("");
      qc.invalidateQueries({ queryKey: ["yatis-not", selectedId] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const bosYataklar = yataklar.filter((y) => !y.dolu_mu);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Servis Hasta Takip</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorumlu olduğunuz servisteki yatan hastalar
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          variant={kapsamBenim ? "default" : "outline"}
          onClick={() => setKapsamBenim(true)}
        >
          Benim servisim
        </Button>
        <Button
          size="sm"
          variant={!kapsamBenim ? "default" : "outline"}
          onClick={() => setKapsamBenim(false)}
        >
          Tüm servisler
        </Button>
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={servisId}
          onChange={(e) => setServisId(e.target.value)}
        >
          <option value="">Servis (filtre)</option>
          {servisler.map((s) => (
            <option key={s.id} value={s.id}>
              {s.ad}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={doktorId}
          onChange={(e) => setDoktorId(e.target.value)}
        >
          <option value="">Doktor</option>
          {doktorlar.map((d) => (
            <option key={d.id} value={d.id}>
              Doktor #{d.id}
            </option>
          ))}
        </select>
        <Input type="date" className="w-auto" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
        <Input type="date" className="w-auto" value={bitis} onChange={(e) => setBitis(e.target.value)} />
      </div>

      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-2 py-2">Protokol</th>
                <th className="px-2 py-2">Ad Soyad</th>
                <th className="px-2 py-2">Yaş</th>
                <th className="px-2 py-2">Cinsiyet</th>
                <th className="px-2 py-2">Yatak/Oda</th>
                <th className="px-2 py-2">Yatış</th>
                <th className="px-2 py-2">Gün</th>
                <th className="px-2 py-2">Doktor</th>
                <th className="px-2 py-2">Durum</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {kayitlar.map((k) => (
                <tr
                  key={k.id}
                  className={`border-b cursor-pointer ${rowClass(k.klinik_durum)} ${
                    selectedId === k.id ? "ring-1 ring-inset ring-primary/40" : ""
                  }`}
                  onClick={() => {
                    setSelectedId(k.id);
                    setTab("vital");
                  }}
                >
                  <td className="px-2 py-2 font-medium">
                    {k.protokol_no}
                    {k.kontrol_edildi_mi ? (
                      <span className="ml-1 text-xs text-green-700">✓</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{k.hasta_ad_soyad}</td>
                  <td className="px-2 py-2">{k.yas ?? "—"}</td>
                  <td className="px-2 py-2">{k.cinsiyet ?? "—"}</td>
                  <td className="px-2 py-2">
                    {k.yatak_no ?? "—"} / {k.oda_no ?? "—"}
                  </td>
                  <td className="px-2 py-2">{fmtDate(k.yatis_tarihi)}</td>
                  <td className="px-2 py-2">{k.gecen_gun}</td>
                  <td className="px-2 py-2">{k.sorumlu_doktor_ad ?? "—"}</td>
                  <td className="px-2 py-2">{k.klinik_durum}</td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedId(k.id);
                            setConfirmTaburcu(true);
                          }}
                        >
                          Taburcu Et
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedId(k.id);
                            setNakilServis(String(k.servis_id));
                            setDialog({ tip: "NAKIL" });
                          }}
                        >
                          Nakil Et
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedId(k.id);
                            setYeniDoktor(String(k.sorumlu_doktor_id ?? ""));
                            setDialog({ tip: "DOKTOR_DEGISTIR" });
                          }}
                        >
                          Doktor Değiştir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedId(k.id);
                            setDialog({ tip: "IZIN" });
                          }}
                        >
                          İzinli Gönder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedId(k.id);
                            islemMut.mutate({ tip: "KONTROL_TOGGLE" });
                          }}
                        >
                          Kontrol Edildi İşaretle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/hemsire/ilac-talep?yatis_id=${k.id}&hasta_id=${k.hasta_id}`}>
                            İlaç/Malzeme Talep
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!kayitlar.length && (
                <tr>
                  <td colSpan={10} className="px-2 py-6 text-center text-muted-foreground">
                    Kayıt yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detay && (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{detay.hasta_ad_soyad}</h3>
              <p className="text-sm text-muted-foreground">
                {detay.protokol_no} · {detay.servis_ad} · {detay.klinik_durum}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
              Kapat
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <span className="text-muted-foreground">Başvuru:</span>{" "}
              {detay.basvuru_no ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Sigorta:</span>{" "}
              {detay.sigorta_turu ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Yatış / Çıkış:</span>{" "}
              {fmtDate(detay.yatis_tarihi)} / {fmtDate(detay.cikis_tarihi)}
            </div>
            <div>
              <span className="text-muted-foreground">Dosya No:</span>{" "}
              {detay.dosya_no ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Kan grubu:</span>{" "}
              {detay.kan_grubu ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Yaş / Cinsiyet:</span>{" "}
              {detay.yas ?? "—"} / {detay.cinsiyet ?? "—"}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b pb-2">
            {(
              [
                ["vital", "Vital Bulgular"],
                ["mar", "İlaç Uygulama"],
                ["servis", "Servis Hareketleri"],
                ["konsultasyon", "Konsültasyonlar"],
                ["notlar", "Notlar"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={tab === key ? "default" : "outline"}
                onClick={() => setTab(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {tab === "vital" && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-4">
                {(
                  [
                    ["tansiyon_sistolik", "Sistolik"],
                    ["tansiyon_diastolik", "Diyastolik"],
                    ["nabiz", "Nabız"],
                    ["ates", "Ateş"],
                    ["solunum", "Solunum"],
                    ["spo2", "SpO2"],
                    ["agri_skoru", "Ağrı"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-xs space-y-1">
                    <span className="text-muted-foreground">{label}</span>
                    <Input
                      className="h-8"
                      value={vitalForm[key]}
                      onChange={(e) =>
                        setVitalForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <Input
                placeholder="Not"
                value={vitalForm.notlar}
                onChange={(e) =>
                  setVitalForm((f) => ({ ...f, notlar: e.target.value }))
                }
              />
              <Button size="sm" disabled={vitalMut.isPending} onClick={() => vitalMut.mutate()}>
                Ölçüm Ekle
              </Button>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-1">Saat</th>
                    <th>TA</th>
                    <th>Nabız</th>
                    <th>Ateş</th>
                    <th>Solunum</th>
                    <th>SpO2</th>
                    <th>Ağrı</th>
                  </tr>
                </thead>
                <tbody>
                  {vitaller.map((v) => (
                    <tr key={v.id} className="border-b">
                      <td className="py-1">{fmtDate(v.olcum_zamani)}</td>
                      <td>
                        {v.tansiyon_sistolik ?? "—"}/{v.tansiyon_diastolik ?? "—"}
                      </td>
                      <td>{v.nabiz ?? "—"}</td>
                      <td>{v.ates ?? "—"}</td>
                      <td>{v.solunum ?? "—"}</td>
                      <td>{v.spo2 ?? "—"}</td>
                      <td>{v.agri_skoru ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "mar" && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1">İlaç</th>
                  <th>Doz</th>
                  <th>Şekil</th>
                  <th>Saat</th>
                  <th>Durum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {marlar.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="py-1">{m.ilac_adi}</td>
                    <td>{m.doz ?? "—"}</td>
                    <td>{m.kullanim_sekli}</td>
                    <td>{fmtDate(m.planlanan_saat)}</td>
                    <td>
                      {m.durum}
                      {m.uygulandi_at ? ` (${fmtDate(m.uygulandi_at)})` : ""}
                    </td>
                    <td className="space-x-1">
                      {m.durum === "BEKLIYOR" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => marMut.mutate({ id: m.id, durum: "VERILDI" })}
                          >
                            Verildi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => marMut.mutate({ id: m.id, durum: "ATLANDI" })}
                          >
                            Atlandı
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!marlar.length && (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground">
                      Uygulama kaydı yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "servis" && (
            <ul className="space-y-2 text-sm">
              {servisHareket.map((r, i) => (
                <li key={i} className="rounded border px-3 py-2">
                  {fmtDate(String(r.tarih ?? ""))} —{" "}
                  {String(r.eski_servis_id ?? "—")} → {String(r.yeni_servis_id)}
                  {r.aciklama ? ` · ${String(r.aciklama)}` : ""}
                </li>
              ))}
              {!servisHareket.length && (
                <li className="text-muted-foreground">Kayıt yok</li>
              )}
            </ul>
          )}

          {tab === "konsultasyon" && (
            <ul className="space-y-2 text-sm">
              {konsultasyonlar.map((r, i) => (
                <li key={i} className="rounded border px-3 py-2">
                  #{String(r.id)} · {String(r.durum)}
                  {r.notlar ? ` · ${String(r.notlar)}` : ""}
                </li>
              ))}
              {!konsultasyonlar.length && (
                <li className="text-muted-foreground">Kayıt yok</li>
              )}
            </ul>
          )}

          {tab === "notlar" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Hasta notu…"
                  value={notMetin}
                  onChange={(e) => setNotMetin(e.target.value)}
                />
                <Button
                  disabled={!notMetin || notMut.isPending}
                  onClick={() => notMut.mutate()}
                >
                  Ekle
                </Button>
              </div>
              <ul className="space-y-2 text-sm">
                {notlar.map((n) => (
                  <li key={n.id} className="rounded border px-3 py-2">
                    {fmtDate(n.created_at)} — {n.metin}
                  </li>
                ))}
                {!notlar.length && (
                  <li className="text-muted-foreground">Not yok</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmTaburcu}
        title="Taburcu et"
        description="Seçili hasta taburcu edilecek. Onaylıyor musunuz?"
        confirmLabel="Taburcu Et"
        destructive
        pending={islemMut.isPending}
        onConfirm={() => islemMut.mutate({ tip: "TABURCU" })}
        onCancel={() => setConfirmTaburcu(false)}
      />

      {dialog?.tip === "NAKIL" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-4 space-y-3">
            <h4 className="font-semibold">Nakil Et</h4>
            <select
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={nakilServis}
              onChange={(e) => {
                setNakilServis(e.target.value);
                setNakilYatak("");
              }}
            >
              {servisler.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad}
                </option>
              ))}
            </select>
            <select
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={nakilYatak}
              onChange={(e) => setNakilYatak(e.target.value)}
            >
              <option value="">Yatak (opsiyonel)</option>
              {bosYataklar.map((y) => (
                <option key={y.id} value={y.id}>
                  Oda {y.oda_no} / {y.yatak_no}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(null)}>
                Vazgeç
              </Button>
              <Button
                onClick={() =>
                  islemMut.mutate({
                    tip: "NAKIL",
                    yeni_servis_id: Number(nakilServis),
                    yeni_yatak_id: nakilYatak ? Number(nakilYatak) : null,
                  })
                }
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {dialog?.tip === "IZIN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-4 space-y-3">
            <h4 className="font-semibold">İzinli Gönder</h4>
            <Input
              placeholder="Açıklama"
              value={izinAciklama}
              onChange={(e) => setIzinAciklama(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(null)}>
                Vazgeç
              </Button>
              <Button
                onClick={() =>
                  islemMut.mutate({ tip: "IZIN", aciklama: izinAciklama || null })
                }
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {dialog?.tip === "DOKTOR_DEGISTIR" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-4 space-y-3">
            <h4 className="font-semibold">Doktor Değiştir</h4>
            <select
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={yeniDoktor}
              onChange={(e) => setYeniDoktor(e.target.value)}
            >
              <option value="">Seçin</option>
              {doktorlar.map((d) => (
                <option key={d.id} value={d.id}>
                  Doktor #{d.id}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(null)}>
                Vazgeç
              </Button>
              <Button
                disabled={!yeniDoktor}
                onClick={() =>
                  islemMut.mutate({
                    tip: "DOKTOR_DEGISTIR",
                    sorumlu_doktor_id: Number(yeniDoktor),
                  })
                }
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
