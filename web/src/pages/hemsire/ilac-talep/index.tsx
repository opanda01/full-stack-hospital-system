import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Badge, Button, Input } from "@/shared/ui";

type YatisListeItem = {
  id: number;
  protokol_no: string;
  hasta_id: number;
  hasta_ad_soyad: string;
  servis_ad: string | null;
  sorumlu_doktor_id: number | null;
};
type Ilac = {
  id: number;
  ad: string;
  barkod: string | null;
  stok: number;
  kritik_stok: number;
  kritik_mi: boolean;
};
type KalemForm = {
  ilac_id: number | null;
  urun_kodu: string;
  urun_adi: string;
  istenen_miktar: string;
  kullanim_sekli: string;
  periyod: string;
  doz: string;
  olcu_birimi: string;
  uygulama_suresi: string;
};
type Satir = {
  talep_id: number;
  kalem_id: number;
  istek_tarihi: string;
  hasta_ad_soyad: string | null;
  protokol_no: string | null;
  urun_kodu: string;
  urun_adi: string;
  istenen_miktar: number;
  verilen_miktar: number;
  durum: string;
  acil_mi: boolean;
};
type Stok = {
  ilac_id: number;
  ad: string;
  barkod: string | null;
  stok: number;
  kritik_stok: number;
  kritik_mi: boolean;
};
type Verilen = {
  talep_id: number;
  istek_tarihi: string;
  urun_kodu: string;
  urun_adi: string;
  verilen_miktar: number;
  kullanim_sekli: string;
  doz: string | null;
};

const emptyKalem = (): KalemForm => ({
  ilac_id: null,
  urun_kodu: "",
  urun_adi: "",
  istenen_miktar: "1",
  kullanim_sekli: "ORAL",
  periyod: "",
  doz: "",
  olcu_birimi: "adet",
  uygulama_suresi: "",
});

type Tab = "form" | "stok" | "verilen";

export function HemsireIlacTalepPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const initialYatis = params.get("yatis_id") ?? "";
  const [tab, setTab] = useState<Tab>("form");
  const [yatisId, setYatisId] = useState(initialYatis);
  const [isteyenBirim, setIsteyenBirim] = useState("");
  const [acilMi, setAcilMi] = useState(false);
  const [kalemler, setKalemler] = useState<KalemForm[]>([emptyKalem()]);
  const [stokIlacId, setStokIlacId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data: kayitlar = [] } = useQuery({
    queryKey: ["yatis-kayitlar-aktif"],
    queryFn: async () =>
      (await api.get<YatisListeItem[]>("/yatis/kayitlar", { params: { aktif: true } }))
        .data,
  });

  const { data: ilaclar = [] } = useQuery({
    queryKey: ["eczane-ilaclar"],
    queryFn: async () => (await api.get<Ilac[]>("/eczane/")).data,
  });

  const selected = kayitlar.find((k) => k.id === Number(yatisId));

  const { data: satirlar = [] } = useQuery({
    queryKey: ["ilac-satirlar"],
    queryFn: async () =>
      (await api.get<Satir[]>("/ilac-talepleri/satirlar")).data,
  });

  const { data: stok } = useQuery({
    queryKey: ["ilac-stok", stokIlacId],
    enabled: !!stokIlacId && tab === "stok",
    queryFn: async () =>
      (
        await api.get<Stok>("/ilac-talepleri/stok", {
          params: { ilac_id: Number(stokIlacId) },
        })
      ).data,
  });

  const { data: verilen = [] } = useQuery({
    queryKey: ["ilac-verilen", selected?.hasta_id],
    enabled: !!selected?.hasta_id && tab === "verilen",
    queryFn: async () =>
      (
        await api.get<Verilen[]>(
          `/ilac-talepleri/hasta/${selected!.hasta_id}/verilen`,
        )
      ).data,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!yatisId) throw new Error("Yatış seçin");
      return api.post("/ilac-talepleri/", {
        yatis_id: Number(yatisId),
        isteyen_doktor_id: selected?.sorumlu_doktor_id ?? null,
        isteyen_birim: isteyenBirim || selected?.servis_ad || null,
        gonder: true,
        acil_mi: acilMi,
        kalemler: kalemler.map((k) => ({
          ilac_id: k.ilac_id,
          urun_kodu: k.urun_kodu,
          urun_adi: k.urun_adi,
          istenen_miktar: Number(k.istenen_miktar),
          verilen_miktar: 0,
          kullanim_sekli: k.kullanim_sekli,
          periyod: k.periyod || null,
          doz: k.doz || null,
          olcu_birimi: k.olcu_birimi || null,
          uygulama_suresi: k.uygulama_suresi || null,
        })),
      });
    },
    onSuccess: () => {
      setMsg("İstek gönderildi (Onay Bekliyor)");
      setErr(null);
      setKalemler([emptyKalem()]);
      setAcilMi(false);
      qc.invalidateQueries({ queryKey: ["ilac-satirlar"] });
      qc.invalidateQueries({ queryKey: ["ilac-talepleri"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const durumMut = useMutation({
    mutationFn: async ({ id, durum }: { id: number; durum: string }) =>
      api.patch(`/ilac-talepleri/${id}/durum`, { durum }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ilac-satirlar"] });
      qc.invalidateQueries({ queryKey: ["ilac-verilen"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const formValid = useMemo(() => {
    if (!yatisId) return false;
    return kalemler.every(
      (k) => k.urun_kodu && k.urun_adi && Number(k.istenen_miktar) > 0,
    );
  }, [yatisId, kalemler]);

  function updateKalem(i: number, patch: Partial<KalemForm>) {
    setKalemler((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  }

  function fillFromIlac(i: number, ilacId: string) {
    const ilac = ilaclar.find((x) => x.id === Number(ilacId));
    if (!ilac) {
      updateKalem(i, { ilac_id: null });
      return;
    }
    updateKalem(i, {
      ilac_id: ilac.id,
      urun_kodu: ilac.barkod || `ILC-${ilac.id}`,
      urun_adi: ilac.ad,
    });
    setStokIlacId(String(ilac.id));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">İlaç / Malzeme Talep</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Depodan hasta için ilaç veya malzeme isteği
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left">
              <th className="px-2 py-2">Tarih</th>
              <th className="px-2 py-2">Hasta</th>
              <th className="px-2 py-2">Ürün</th>
              <th className="px-2 py-2">İstenen</th>
              <th className="px-2 py-2">Verilen</th>
              <th className="px-2 py-2">Durum</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr key={`${s.talep_id}-${s.kalem_id}`} className="border-b">
                <td className="px-2 py-2">
                  {new Date(s.istek_tarihi).toLocaleString("tr-TR")}
                </td>
                <td className="px-2 py-2">
                  {s.hasta_ad_soyad} ({s.protokol_no})
                </td>
                <td className="px-2 py-2">
                  {s.urun_adi}
                  {s.acil_mi && (
                    <Badge className="ml-1" variant="destructive">
                      Acil
                    </Badge>
                  )}
                </td>
                <td className="px-2 py-2">{s.istenen_miktar}</td>
                <td className="px-2 py-2">{s.verilen_miktar}</td>
                <td className="px-2 py-2">
                  <Badge variant="outline">{s.durum}</Badge>
                </td>
                <td className="px-2 py-2 space-x-1">
                  {s.durum === "ONAY_BEKLIYOR" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        durumMut.mutate({ id: s.talep_id, durum: "ONAYLANDI" })
                      }
                    >
                      Onayla
                    </Button>
                  )}
                  {s.durum === "ONAYLANDI" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        durumMut.mutate({ id: s.talep_id, durum: "VERILDI" })
                      }
                    >
                      Verildi
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!satirlar.length && (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
                  Talep yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-2">
        {(
          [
            ["form", "Yeni Talep"],
            ["stok", "Depo Stok Durumu"],
            ["verilen", "Hastaya Verilen İlaçlar"],
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

      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {tab === "form" && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Hasta / Yatış</span>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={yatisId}
                onChange={(e) => setYatisId(e.target.value)}
              >
                <option value="">Seçin</option>
                {kayitlar.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.hasta_ad_soyad} — {k.protokol_no}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Protokol</span>
              <Input readOnly value={selected?.protokol_no ?? ""} />
            </label>
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Servis / Birim</span>
              <Input
                value={isteyenBirim}
                placeholder={selected?.servis_ad ?? "Birim"}
                onChange={(e) => setIsteyenBirim(e.target.value)}
              />
            </label>
            <label className="text-sm flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={acilMi}
                onChange={(e) => setAcilMi(e.target.checked)}
              />
              Acil talep
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Ürün</th>
                  <th>Kod</th>
                  <th>Miktar</th>
                  <th>Kullanım</th>
                  <th>Periyod</th>
                  <th>Doz</th>
                  <th>Süre</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {kalemler.map((k, i) => (
                  <tr key={i} className="border-b align-top">
                    <td className="py-2 pr-2">
                      <select
                        className="h-8 w-40 rounded border bg-background px-1 text-xs"
                        value={k.ilac_id ?? ""}
                        onChange={(e) => fillFromIlac(i, e.target.value)}
                      >
                        <option value="">Seç / serbest</option>
                        {ilaclar.map((il) => (
                          <option key={il.id} value={il.id}>
                            {il.ad}
                          </option>
                        ))}
                      </select>
                      <Input
                        className="mt-1 h-8"
                        value={k.urun_adi}
                        onChange={(e) => updateKalem(i, { urun_adi: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 w-24"
                        value={k.urun_kodu}
                        onChange={(e) => updateKalem(i, { urun_kodu: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 w-16"
                        type="number"
                        value={k.istenen_miktar}
                        onChange={(e) =>
                          updateKalem(i, { istenen_miktar: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className="h-8 rounded border bg-background px-1 text-xs"
                        value={k.kullanim_sekli}
                        onChange={(e) =>
                          updateKalem(i, { kullanim_sekli: e.target.value })
                        }
                      >
                        <option value="ORAL">Oral</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="SUBKUTAN">Subkutan</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 w-24"
                        value={k.periyod}
                        onChange={(e) => updateKalem(i, { periyod: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 w-20"
                        value={k.doz}
                        onChange={(e) => updateKalem(i, { doz: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 w-20"
                        value={k.uygulama_suresi}
                        onChange={(e) =>
                          updateKalem(i, { uygulama_suresi: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={kalemler.length <= 1}
                        onClick={() =>
                          setKalemler((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        Sil
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setKalemler((p) => [...p, emptyKalem()])}>
              Satır Ekle
            </Button>
            <Button
              disabled={!formValid || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              İstek Gönder
            </Button>
          </div>
        </div>
      )}

      {tab === "stok" && (
        <div className="rounded-xl border bg-card p-4 space-y-3 max-w-lg">
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={stokIlacId}
            onChange={(e) => setStokIlacId(e.target.value)}
          >
            <option value="">Ürün seçin</option>
            {ilaclar.map((il) => (
              <option key={il.id} value={il.id}>
                {il.ad}
              </option>
            ))}
          </select>
          {stok && (
            <div className="text-sm space-y-1">
              <p>
                <strong>{stok.ad}</strong> ({stok.barkod ?? "—"})
              </p>
              <p>
                Stok: {stok.stok} / Kritik: {stok.kritik_stok}
              </p>
              {stok.kritik_mi && (
                <p className="text-red-600">Kritik stok seviyesinin altında</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "verilen" && (
        <div className="space-y-2">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Önce yatış seçin.</p>
          ) : verilen.length === 0 ? (
            <p className="text-sm text-muted-foreground">Verilmiş ilaç yok.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Tarih</th>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Kullanım</th>
                  <th>Doz</th>
                </tr>
              </thead>
              <tbody>
                {verilen.map((v, i) => (
                  <tr key={`${v.talep_id}-${i}`} className="border-b">
                    <td className="py-2">
                      {new Date(v.istek_tarihi).toLocaleString("tr-TR")}
                    </td>
                    <td>{v.urun_adi}</td>
                    <td>{v.verilen_miktar}</td>
                    <td>{v.kullanim_sekli}</td>
                    <td>{v.doz ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
