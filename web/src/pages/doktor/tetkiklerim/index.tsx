import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Tetkik = {
  id: number;
  hasta_id: number;
  tetkik_turu: string;
  sonuc_dosyasi: string | null;
  durum: string;
};
type Doktor = { id: number };
type Hasta = { id: number; ad?: string | null; soyad?: string | null };

export function DoktorTetkiklerimPage() {
  const qc = useQueryClient();
  const [durumFiltre, setDurumFiltre] = useState("");
  const [hastaId, setHastaId] = useState("");
  const [tur, setTur] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: tetkikler = [], isLoading, isError, error } = useQuery({
    queryKey: ["tetkikler"],
    queryFn: async () => (await api.get<Tetkik[]>("/tetkikler/")).data,
  });
  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/benim")).data,
  });

  const hastaLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of hastalar) {
      m.set(h.id, `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const filtered = useMemo(() => {
    return tetkikler.filter((t) => !durumFiltre || t.durum === durumFiltre);
  }, [tetkikler, durumFiltre]);

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/tetkikler/", {
        hasta_id: Number(hastaId),
        istek_yapan_doktor_id: doktor!.id,
        tetkik_turu: tur,
      }),
    onSuccess: () => {
      setErr(null);
      setTur("");
      qc.invalidateQueries({ queryKey: ["tetkikler"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tetkiklerim</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Laboratuvar / radyoloji istekleri ve sonuçları
        </p>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Yeni tetkik isteği</h3>
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
          <option value="">Hasta seç</option>
          {hastalar.map((h) => (
            <option key={h.id} value={h.id}>
              {hastaLabel.get(h.id)}
            </option>
          ))}
        </select>
        <Input
          placeholder="Tetkik türü"
          value={tur}
          onChange={(e) => setTur(e.target.value)}
        />
        <Button
          type="button"
          disabled={!hastaId || !tur || !doktor || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          İstek oluştur
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={durumFiltre === "" ? "default" : "outline"}
          onClick={() => setDurumFiltre("")}
        >
          Tümü
        </Button>
        <Button
          size="sm"
          variant={durumFiltre === "BEKLEMEDE" ? "default" : "outline"}
          onClick={() => setDurumFiltre("BEKLEMEDE")}
        >
          Bekleyen
        </Button>
        <Button
          size="sm"
          variant={durumFiltre === "SONUCLANDI" ? "default" : "outline"}
          onClick={() => setDurumFiltre("SONUCLANDI")}
        >
          Sonuçlandı
        </Button>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tetkik yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Hasta</th>
              <th>Tür</th>
              <th>Durum</th>
              <th>Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">
                  {hastaLabel.get(t.hasta_id) ?? `#${t.hasta_id}`}
                </td>
                <td>{t.tetkik_turu}</td>
                <td>{t.durum}</td>
                <td>{t.sonuc_dosyasi ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Eski rota uyumluluğu */
export { DoktorTetkiklerimPage as DoktorTetkikIstePage };
