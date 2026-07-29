import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulDateTime, getApiErrorMessage, LOOKUP_PAGE_SIZE, unwrapPage, type PageResponse } from "@/shared/lib";
import { randevuHastaAdi } from "@/entities/randevu";
import {
  DoktorHastaSecimField,
  useDoktorHastaListeFiltresi,
} from "@/features/doktor-hasta-secim";
import { Icd10TaniField } from "@/features/icd10-tani/ui/Icd10TaniField";

type Randevu = {
  id: string;
  durum: string;
  tarih_saat: string;
  hasta_id: string;
  hasta_ad_soyad?: string | null;
};
type Doktor = { id: number };
type ReceteKalem = {
  id?: number;
  urun_adi: string;
  doz?: string;
  periyod?: string;
  sira: number;
};
type Muayene = {
  id: number;
  randevu_id: number;
  tani: string | null;
  tedavi_plani: string | null;
  recete_kalemleri?: ReceteKalem[];
};
type Alerji = {
  id: number;
  allerjen_adi: string;
  siddet: string;
};

type ApiDetail = {
  kod?: string;
  mesaj?: string;
  uyarilar?: { kod: string; mesaj: string }[];
};

function extractDetail(e: unknown): ApiDetail | null {
  const ax = e as { response?: { data?: { detail?: ApiDetail | string } } };
  const d = ax?.response?.data?.detail;
  if (d && typeof d === "object") return d;
  return null;
}

export function DoktorMuayeneEkraniPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const initialRandevu = params.get("randevu") ?? "";

  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const { data: muayeneler = [] } = useQuery({
    queryKey: ["muayeneler"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Muayene>>("/muayeneler/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
  const [randevuId, setRandevuId] = useState(initialRandevu);
  const [tani, setTani] = useState("");
  const [tedavi, setTedavi] = useState("");
  const [kalemAd, setKalemAd] = useState("");
  const [kalemDoz, setKalemDoz] = useState("");
  const [kalemler, setKalemler] = useState<ReceteKalem[]>([]);
  const [tetkikTuru, setTetkikTuru] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingUyarilar, setPendingUyarilar] = useState<
    { kod: string; mesaj: string }[] | null
  >(null);
  const [gerekce, setGerekce] = useState("");
  const hastaFiltre = useDoktorHastaListeFiltresi();

  const randevuSecenekleri = useMemo(
    () =>
      randevular.filter(
        (r) => r.durum !== "IPTAL" && hastaFiltre.matchHastaId(r.hasta_id),
      ),
    [randevular, hastaFiltre.matchHastaId],
  );

  const selected = randevular.find((r) => r.id === randevuId);
  const existing = muayeneler.find((m) => m.randevu_id === Number(randevuId));

  const { data: alerjiler = [] } = useQuery({
    queryKey: ["alerjiler", selected?.hasta_id],
    enabled: Boolean(selected?.hasta_id),
    queryFn: async () =>
      (await api.get<Alerji[]>(`/hastalar/${selected!.hasta_id}/alerjiler`)).data,
  });

  const payloadBase = () => ({
    tani,
    tedavi_plani: tedavi,
    recete_kalemleri: kalemler.map((k, i) => ({
      urun_adi: k.urun_adi,
      doz: k.doz || null,
      periyod: k.periyod || null,
      sira: i + 1,
    })),
  });

  const saveMut = useMutation({
    mutationFn: async (uyariOnay?: { gerekce: string; uyari_kodlari: string[] }) => {
      const body = {
        ...payloadBase(),
        ...(uyariOnay ? { uyari_onay: uyariOnay } : {}),
      };
      if (editingId || existing) {
        const id = editingId ?? existing!.id;
        return api.patch(`/muayeneler/${id}`, body);
      }
      return api.post("/muayeneler/", {
        randevu_id: Number(randevuId),
        ...body,
      });
    },
    onSuccess: () => {
      setMsg(existing || editingId ? "Muayene güncellendi" : "Muayene kaydedildi");
      setErr(null);
      setPendingUyarilar(null);
      setGerekce("");
      qc.invalidateQueries({ queryKey: ["randevular"] });
      qc.invalidateQueries({ queryKey: ["muayeneler"] });
    },
    onError: (e) => {
      const detail = extractDetail(e);
      if (detail?.kod === "RECETE_HARD_STOP") {
        setPendingUyarilar(null);
        setErr(detail.mesaj || "Reçete engellendi (hard-stop)");
        return;
      }
      if (detail?.kod === "RECETE_UYARI_ONAY_GEREKLI" && detail.uyarilar) {
        setPendingUyarilar(detail.uyarilar);
        setErr(detail.mesaj || "Uyarı onayı gerekli");
        return;
      }
      setErr(getApiErrorMessage(e));
    },
  });

  const tetkik = useMutation({
    mutationFn: async () =>
      api.post("/tetkikler/", {
        hasta_id: selected!.hasta_id,
        istek_yapan_doktor_id: doktor!.id,
        tetkik_turu: tetkikTuru,
      }),
    onSuccess: () => {
      setMsg("Tetkik isteği oluşturuldu");
      setTetkikTuru("");
      qc.invalidateQueries({ queryKey: ["tetkikler"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const loadExisting = (rId: string) => {
    setRandevuId(rId);
    setPendingUyarilar(null);
    setGerekce("");
    const m = muayeneler.find((x) => x.randevu_id === Number(rId));
    if (m) {
      setEditingId(m.id);
      setTani(m.tani ?? "");
      setTedavi(m.tedavi_plani ?? "");
      setKalemler(
        (m.recete_kalemleri ?? []).map((k, i) => ({
          urun_adi: k.urun_adi,
          doz: k.doz,
          periyod: k.periyod,
          sira: k.sira ?? i + 1,
        }))
      );
    } else {
      setEditingId(null);
      setTani("");
      setTedavi("");
      setKalemler([]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Muayene</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kendi randevularınız için muayene kaydı oluşturun veya düzenleyin
        </p>
      </div>

      <div className="max-w-lg space-y-3 rounded-xl border border-border bg-card p-4">
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}
        {alerjiler.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Alerjiler:{" "}
            {alerjiler.map((a) => `${a.allerjen_adi} (${a.siddet})`).join(", ")}
          </div>
        )}
        <DoktorHastaSecimField
          mode="filtre"
          hastaModu={hastaFiltre.hastaModu}
          onModuChange={hastaFiltre.switchModu}
          hastaTarih={hastaFiltre.hastaTarih}
          onTarihChange={hastaFiltre.changeTarih}
          options={hastaFiltre.hastaSecenekleri}
          value={hastaFiltre.hastaId}
          onChange={hastaFiltre.setHastaId}
        />
        <select
          className="w-full rounded-md border border-border px-3 py-2"
          value={randevuId}
          onChange={(e) => loadExisting(e.target.value)}
        >
          <option value="">Randevu seç</option>
          {randevuSecenekleri.map((r) => (
              <option key={r.id} value={r.id}>
                {randevuHastaAdi(r)} ·{" "}
                {formatIstanbulDateTime(r.tarih_saat)} · {r.durum}
              </option>
            ))}
        </select>
        <Icd10TaniField value={tani} onChange={setTani} />
        <textarea
          className="w-full rounded-md border border-border px-3 py-2"
          placeholder="Tedavi planı"
          value={tedavi}
          onChange={(e) => setTedavi(e.target.value)}
        />

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm font-medium">Reçete kalemleri</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-border px-3 py-2"
              placeholder="İlaç adı"
              value={kalemAd}
              onChange={(e) => setKalemAd(e.target.value)}
            />
            <input
              className="w-28 rounded-md border border-border px-3 py-2"
              placeholder="Doz"
              value={kalemDoz}
              onChange={(e) => setKalemDoz(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!kalemAd.trim()) return;
                setKalemler((prev) => [
                  ...prev,
                  {
                    urun_adi: kalemAd.trim(),
                    doz: kalemDoz.trim() || undefined,
                    sira: prev.length + 1,
                  },
                ]);
                setKalemAd("");
                setKalemDoz("");
              }}
            >
              Ekle
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {kalemler.map((k, i) => (
              <li key={`${k.urun_adi}-${i}`} className="flex justify-between gap-2">
                <span>
                  {k.urun_adi}
                  {k.doz ? ` — ${k.doz}` : ""}
                </span>
                <button
                  type="button"
                  className="text-red-600 underline"
                  onClick={() =>
                    setKalemler((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        </div>

        {pendingUyarilar && (
          <div className="space-y-2 rounded-md border border-orange-300 bg-orange-50 p-3">
            <p className="text-sm font-medium text-orange-900">Uyarı onayı gerekli</p>
            <ul className="list-disc pl-5 text-sm text-orange-900">
              {pendingUyarilar.map((u) => (
                <li key={u.kod}>{u.mesaj}</li>
              ))}
            </ul>
            <textarea
              className="w-full rounded-md border border-border px-3 py-2"
              placeholder="Gerekçe (min 10 karakter)"
              value={gerekce}
              onChange={(e) => setGerekce(e.target.value)}
            />
            <Button
              type="button"
              onClick={() =>
                saveMut.mutate({
                  gerekce,
                  uyari_kodlari: pendingUyarilar.map((u) => u.kod),
                })
              }
              disabled={gerekce.trim().length < 10 || saveMut.isPending}
            >
              Uyarıyı onayla ve kaydet
            </Button>
          </div>
        )}

        <Button
          type="button"
          onClick={() => saveMut.mutate(undefined)}
          disabled={!randevuId || !tani || saveMut.isPending}
        >
          {existing || editingId ? "Muayeneyi güncelle" : "Muayene kaydet"}
        </Button>

        {selected && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3 text-sm">
            <Link
              className="underline"
              to={`/doktor/receteler?hasta=${selected.hasta_id}`}
            >
              Reçete yaz
            </Link>
            <Link
              className="underline"
              to={`/doktor/sevkler?hasta=${selected.hasta_id}`}
            >
              Sevk oluştur
            </Link>
            <Link
              className="underline"
              to={`/doktor/tibbi-raporlar?hasta=${selected.hasta_id}`}
            >
              Tıbbi rapor
            </Link>
            <Link className="underline" to="/doktor/tetkiklerim">
              Tetkiklerim
            </Link>
          </div>
        )}

        <hr className="border-border" />
        <input
          className="w-full rounded-md border border-border px-3 py-2"
          placeholder="Tetkik türü (örn. Tam kan sayımı)"
          value={tetkikTuru}
          onChange={(e) => setTetkikTuru(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => tetkik.mutate()}
          disabled={!randevuId || !tetkikTuru || !doktor || tetkik.isPending}
        >
          Tetkik iste
        </Button>
      </div>
    </div>
  );
}
