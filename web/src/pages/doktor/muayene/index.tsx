import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulDateTime, getApiErrorMessage } from "@/shared/lib";

type Randevu = {
  id: number;
  durum: string;
  tarih_saat: string;
  hasta_id: number;
};
type Doktor = { id: number };
type Muayene = {
  id: number;
  randevu_id: number;
  tani: string | null;
  tedavi_plani: string | null;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null };

export function DoktorMuayeneEkraniPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const initialRandevu = params.get("randevu") ?? "";

  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const { data: muayeneler = [] } = useQuery({
    queryKey: ["muayeneler"],
    queryFn: async () => (await api.get<Muayene[]>("/muayeneler/")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/benim")).data,
  });

  const [randevuId, setRandevuId] = useState(initialRandevu);
  const [tani, setTani] = useState("");
  const [tedavi, setTedavi] = useState("");
  const [tetkikTuru, setTetkikTuru] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const hastaLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of hastalar) {
      m.set(h.id, `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const selected = randevular.find((r) => r.id === Number(randevuId));
  const existing = muayeneler.find((m) => m.randevu_id === Number(randevuId));

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editingId || existing) {
        const id = editingId ?? existing!.id;
        return api.patch(`/muayeneler/${id}`, {
          tani,
          tedavi_plani: tedavi,
        });
      }
      return api.post("/muayeneler/", {
        randevu_id: Number(randevuId),
        tani,
        tedavi_plani: tedavi,
        receteler: null,
      });
    },
    onSuccess: () => {
      setMsg(existing || editingId ? "Muayene güncellendi" : "Muayene kaydedildi");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["randevular"] });
      qc.invalidateQueries({ queryKey: ["muayeneler"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
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
    const m = muayeneler.find((x) => x.randevu_id === Number(rId));
    if (m) {
      setEditingId(m.id);
      setTani(m.tani ?? "");
      setTedavi(m.tedavi_plani ?? "");
    } else {
      setEditingId(null);
      setTani("");
      setTedavi("");
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
        <select
          className="w-full rounded-md border border-border px-3 py-2"
          value={randevuId}
          onChange={(e) => loadExisting(e.target.value)}
        >
          <option value="">Randevu seç</option>
          {randevular
            .filter((r) => r.durum !== "IPTAL")
            .map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} · {hastaLabel.get(r.hasta_id) ?? r.hasta_id} ·{" "}
                {formatIstanbulDateTime(r.tarih_saat)} · {r.durum}
              </option>
            ))}
        </select>
        <textarea
          className="w-full rounded-md border border-border px-3 py-2"
          placeholder="Tanı"
          value={tani}
          onChange={(e) => setTani(e.target.value)}
        />
        <textarea
          className="w-full rounded-md border border-border px-3 py-2"
          placeholder="Tedavi planı"
          value={tedavi}
          onChange={(e) => setTedavi(e.target.value)}
        />
        <Button
          type="button"
          onClick={() => saveMut.mutate()}
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
              to={`/doktor/sevler?hasta=${selected.hasta_id}`}
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
