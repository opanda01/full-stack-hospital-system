import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type Olay = {
  id: number;
  tip: string;
  durum: string;
  yer: string;
  ozet: string;
  mudahale_notu: string | null;
  olay_zamani: string;
  beyaz_kod_referans: string | null;
  kolluk_bilgilendirildi: boolean;
};

const TIPLER = [
  "BEYAZ_KOD",
  "MAVI_KOD",
  "PEMBE_KOD",
  "KIRMIZI_KOD",
  "GRI_KOD",
  "GENEL",
] as const;

const DURUMLAR = ["ACIK", "MUDAHALE", "COZULDU", "IPTAL"] as const;

export function GuvenlikOlaylarPage() {
  const qc = useQueryClient();
  const [tip, setTip] = useState<string>("GENEL");
  const [yer, setYer] = useState("");
  const [ozet, setOzet] = useState("");
  const [beyazKod, setBeyazKod] = useState("");
  const [kolluk, setKolluk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: olaylar = [], isLoading } = useQuery({
    queryKey: ["guvenlik-olaylar"],
    queryFn: async () => (await api.get<Olay[]>("/guvenlik/olaylar")).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/guvenlik/olaylar", {
        tip,
        yer,
        ozet,
        beyaz_kod_referans: beyazKod || null,
        kolluk_bilgilendirildi: kolluk,
      }),
    onSuccess: () => {
      setYer("");
      setOzet("");
      setBeyazKod("");
      setKolluk(false);
      setErr(null);
      qc.invalidateQueries({ queryKey: ["guvenlik-olaylar"] });
      qc.invalidateQueries({ queryKey: ["guvenlik-ozet"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      durum,
      mudahale_notu,
    }: {
      id: number;
      durum?: string;
      mudahale_notu?: string;
    }) => api.patch(`/guvenlik/olaylar/${id}`, { durum, mudahale_notu }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guvenlik-olaylar"] });
      qc.invalidateQueries({ queryKey: ["guvenlik-ozet"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Güvenlik Olayları</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kod çağrıları ve tutanak kayıtları
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!yer.trim() || !ozet.trim()) return;
          createMut.mutate();
        }}
      >
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Tip</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
          >
            {TIPLER.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Yer</span>
          <Input value={yer} onChange={(e) => setYer(e.target.value)} />
        </label>
        <label className="min-w-[220px] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Özet</span>
          <Input value={ozet} onChange={(e) => setOzet(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Beyaz kod ref.</span>
          <Input value={beyazKod} onChange={(e) => setBeyazKod(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={kolluk}
            onChange={(e) => setKolluk(e.target.checked)}
          />
          Kolluk bilgilendirildi
        </label>
        <Button type="submit" disabled={createMut.isPending}>
          Olay kaydet
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {olaylar.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card p-3 text-sm"
            >
              <div>
                <div className="font-medium">
                  {o.tip.replace("_", " ")} · {o.durum} · {o.yer}
                </div>
                <div className="text-muted-foreground">{o.ozet}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.olay_zamani).toLocaleString("tr-TR")}
                  {o.beyaz_kod_referans ? ` · Ref: ${o.beyaz_kod_referans}` : ""}
                  {o.kolluk_bilgilendirildi ? " · Kolluk" : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={o.durum}
                  onChange={(e) =>
                    updateMut.mutate({ id: o.id, durum: e.target.value })
                  }
                >
                  {DURUMLAR.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {o.durum !== "COZULDU" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateMut.mutate({
                        id: o.id,
                        durum: "COZULDU",
                        mudahale_notu: o.mudahale_notu ?? "Çözüldü",
                      })
                    }
                  >
                    Çözüldü işaretle
                  </Button>
                )}
              </div>
            </li>
          ))}
          {!olaylar.length && (
            <p className="text-muted-foreground">Kayıtlı olay yok.</p>
          )}
        </ul>
      )}
    </div>
  );
}
