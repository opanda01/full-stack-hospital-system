import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Tur = "RECETE" | "SEVK" | "TIBBI_RAPOR";

type Kayit = {
  id: number;
  tur: string;
  hasta_id: number | null;
  icerik: string;
  onay_durumu: string;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null };

const TITLES: Record<Tur, string> = {
  RECETE: "Reçeteler",
  SEVK: "Sevkler",
  TIBBI_RAPOR: "Tıbbi raporlar",
};

const PLACEHOLDERS: Record<Tur, string> = {
  RECETE: "İlaçlar, doz, kullanım…",
  SEVK: "Sevk edilen birim / gerekçe…",
  TIBBI_RAPOR: "Rapor metni…",
};

export function DoktorKlinikBelgePage({ tur }: { tur: Tur }) {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [hastaId, setHastaId] = useState(params.get("hasta") ?? "");
  const [icerik, setIcerik] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: kayitlar = [], isLoading, isError, error } = useQuery({
    queryKey: ["klinik-onay", tur],
    queryFn: async () =>
      (await api.get<Kayit[]>("/klinik-onay/", { params: { tur } })).data,
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

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/klinik-onay/", {
        tur,
        hasta_id: hastaId ? Number(hastaId) : null,
        icerik,
      }),
    onSuccess: () => {
      setErr(null);
      setIcerik("");
      qc.invalidateQueries({ queryKey: ["klinik-onay"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

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
        <textarea
          className="min-h-[100px] w-full rounded-md border border-border px-3 py-2"
          placeholder={PLACEHOLDERS[tur]}
          value={icerik}
          onChange={(e) => setIcerik(e.target.value)}
        />
        <Button
          type="button"
          disabled={!icerik.trim() || createMut.isPending}
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
              <p className="mt-1 text-muted-foreground">{k.icerik}</p>
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
