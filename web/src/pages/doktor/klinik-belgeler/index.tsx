import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Button } from "@/shared/ui";

type Tur = "RECETE" | "SEVK" | "TIBBI_RAPOR";

type Kayit = {
  id: number;
  tur: string;
  hasta_id: string | null;
  icerik: string;
  onay_durumu: string;
};

type ReceteKalem = {
  urun_adi: string;
  doz: string;
  kullanim: string;
};

type Departman = { id: number; ad: string };

type TibbiRaporTipi =
  | "IS_GOREMEZLIK"
  | "SAGLIK_KURULU_ON"
  | "GENEL";

const TITLES: Record<Tur, string> = {
  RECETE: "Reçeteler",
  SEVK: "Sevkler",
  TIBBI_RAPOR: "Tıbbi raporlar",
};

const RAPOR_TIP_LABEL: Record<TibbiRaporTipi, string> = {
  IS_GOREMEZLIK: "İş göremezlik",
  SAGLIK_KURULU_ON: "Sağlık kurulu ön raporu",
  GENEL: "Genel",
};

const HASTA_ZORUNLU: Tur[] = ["RECETE", "SEVK"];

function receteIcerik(kalemler: ReceteKalem[]): string {
  const lines = kalemler.map(
    (k, i) =>
      `${i + 1}. ${k.urun_adi}${k.doz ? ` — ${k.doz}` : ""}${k.kullanim ? ` — ${k.kullanim}` : ""}`,
  );
  return `Reçete kalemleri:\n${lines.join("\n")}`;
}

function sevkIcerik(departmanAd: string, gerekce: string): string {
  return `Hedef departman: ${departmanAd}\nGerekçe:\n${gerekce.trim()}`;
}

function raporIcerik(tip: TibbiRaporTipi, govde: string): string {
  return `Rapor tipi: ${RAPOR_TIP_LABEL[tip]}\n---\n${govde.trim()}`;
}

export function DoktorKlinikBelgePage({ tur }: { tur: Tur }) {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const hastaSecim = useDoktorHastaSecim(params.get("hasta") ?? "");
  const { hastaId, setHastaId, hastaLabel } = hastaSecim;
  const [err, setErr] = useState<string | null>(null);

  const [kalemAd, setKalemAd] = useState("");
  const [kalemDoz, setKalemDoz] = useState("");
  const [kalemKullanim, setKalemKullanim] = useState("");
  const [kalemler, setKalemler] = useState<ReceteKalem[]>([]);

  const [hedefDepartmanId, setHedefDepartmanId] = useState("");
  const [sevkGerekce, setSevkGerekce] = useState("");

  const [raporTipi, setRaporTipi] = useState<TibbiRaporTipi>("GENEL");
  const [raporGovde, setRaporGovde] = useState("");

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
    enabled: tur === "SEVK",
  });

  const hedefDepartmanAd = useMemo(
    () => departmanlar.find((d) => String(d.id) === hedefDepartmanId)?.ad ?? "",
    [departmanlar, hedefDepartmanId],
  );

  const icerik = useMemo(() => {
    if (tur === "RECETE") return receteIcerik(kalemler);
    if (tur === "SEVK") return sevkIcerik(hedefDepartmanAd || "—", sevkGerekce);
    return raporIcerik(raporTipi, raporGovde);
  }, [tur, kalemler, hedefDepartmanAd, sevkGerekce, raporTipi, raporGovde]);

  const formGecerli = useMemo(() => {
    if (tur === "RECETE") return kalemler.length > 0;
    if (tur === "SEVK") return Boolean(hedefDepartmanId && sevkGerekce.trim());
    return Boolean(raporGovde.trim());
  }, [tur, kalemler, hedefDepartmanId, sevkGerekce, raporGovde]);

  const { data: kayitlar = [], isLoading, isError, error } = useQuery({
    queryKey: ["klinik-onay", tur],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Kayit>>("/klinik-onay/", {
            params: { tur, page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const resetForm = () => {
    setKalemler([]);
    setKalemAd("");
    setKalemDoz("");
    setKalemKullanim("");
    setHedefDepartmanId("");
    setSevkGerekce("");
    setRaporGovde("");
    setRaporTipi("GENEL");
    hastaSecim.setHastaId("");
  };

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/klinik-onay/", {
        tur,
        hasta_id: hastaId || null,
        icerik,
      }),
    onSuccess: () => {
      setErr(null);
      resetForm();
      qc.invalidateQueries({ queryKey: ["klinik-onay"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const hastaZorunlu = HASTA_ZORUNLU.includes(tur);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{TITLES[tur]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Oluşturduğunuz kayıtlar başhekim onay kuyruğuna düşer
        </p>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
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

        {tur === "RECETE" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Reçete kalemleri</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className="rounded-md border border-border px-3 py-2 text-sm sm:col-span-1"
                placeholder="İlaç adı"
                value={kalemAd}
                onChange={(e) => setKalemAd(e.target.value)}
              />
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                placeholder="Doz"
                value={kalemDoz}
                onChange={(e) => setKalemDoz(e.target.value)}
              />
              <input
                className="rounded-md border border-border px-3 py-2 text-sm"
                placeholder="Kullanım şekli"
                value={kalemKullanim}
                onChange={(e) => setKalemKullanim(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!kalemAd.trim()}
              onClick={() => {
                setKalemler((prev) => [
                  ...prev,
                  {
                    urun_adi: kalemAd.trim(),
                    doz: kalemDoz.trim(),
                    kullanim: kalemKullanim.trim(),
                  },
                ]);
                setKalemAd("");
                setKalemDoz("");
                setKalemKullanim("");
              }}
            >
              Kalem ekle
            </Button>
            {kalemler.length > 0 && (
              <ul className="space-y-1 text-sm">
                {kalemler.map((k, i) => (
                  <li
                    key={`${k.urun_adi}-${i}`}
                    className="flex items-center justify-between rounded border border-border px-2 py-1"
                  >
                    <span>
                      {k.urun_adi}
                      {k.doz ? ` · ${k.doz}` : ""}
                      {k.kullanim ? ` · ${k.kullanim}` : ""}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() =>
                        setKalemler((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tur === "SEVK" && (
          <div className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Hedef departman</span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={hedefDepartmanId}
                onChange={(e) => setHedefDepartmanId(e.target.value)}
              >
                <option value="">Seçin</option>
                {departmanlar.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ad}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="min-h-[88px] w-full rounded-md border border-border px-3 py-2 text-sm"
              placeholder="Sevk gerekçesi"
              value={sevkGerekce}
              onChange={(e) => setSevkGerekce(e.target.value)}
            />
          </div>
        )}

        {tur === "TIBBI_RAPOR" && (
          <div className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Rapor tipi</span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={raporTipi}
                onChange={(e) => setRaporTipi(e.target.value as TibbiRaporTipi)}
              >
                {(Object.keys(RAPOR_TIP_LABEL) as TibbiRaporTipi[]).map((k) => (
                  <option key={k} value={k}>
                    {RAPOR_TIP_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-border px-3 py-2 text-sm"
              placeholder="Rapor gövdesi"
              value={raporGovde}
              onChange={(e) => setRaporGovde(e.target.value)}
            />
          </div>
        )}

        <Button
          type="button"
          disabled={
            !formGecerli ||
            (hastaZorunlu && !hastaId) ||
            createMut.isPending
          }
          onClick={() => createMut.mutate()}
        >
          Gönder
        </Button>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : kayitlar.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kayıt yok.</p>
      ) : (
        <ul className="space-y-2">
          {kayitlar.map((k) => (
            <li key={k.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="font-medium">
                {k.onay_durumu}
                {k.hasta_id
                  ? ` · ${hastaLabel.get(k.hasta_id) ?? `#${k.hasta_id}`}`
                  : ""}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {k.icerik}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DoktorRecetelerPage() {
  return <DoktorKlinikBelgePage tur="RECETE" />;
}
export function DoktorSevlerPage() {
  return <DoktorKlinikBelgePage tur="SEVK" />;
}
export function DoktorTibbiRaporlarPage() {
  return <DoktorKlinikBelgePage tur="TIBBI_RAPOR" />;
}
