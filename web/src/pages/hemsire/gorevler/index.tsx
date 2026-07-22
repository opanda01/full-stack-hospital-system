import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type Gorev = {
  id: number;
  baslik: string;
  yatis_id: number | null;
  son_tarih: string;
  tamamlandi_mi: boolean;
};
type Yatis = { id: number; protokol_no: string; hasta_ad_soyad: string };

export function HemsireGorevlerPage() {
  const qc = useQueryClient();
  const [baslik, setBaslik] = useState("");
  const [yatisId, setYatisId] = useState("");
  const [sonTarih, setSonTarih] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: gorevler = [], isLoading } = useQuery({
    queryKey: ["hemsire-gorevler"],
    queryFn: async () =>
      (await api.get<Gorev[]>("/yatis/gorevler", { params: { benim: true } })).data,
  });

  const { data: yatislar = [] } = useQuery({
    queryKey: ["yatis-kayitlar-aktif"],
    queryFn: async () =>
      (await api.get<Yatis[]>("/yatis/kayitlar", { params: { aktif: true } })).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/yatis/gorevler", {
        baslik,
        yatis_id: yatisId ? Number(yatisId) : null,
        son_tarih: sonTarih
          ? new Date(sonTarih).toISOString()
          : new Date().toISOString(),
      }),
    onSuccess: () => {
      setBaslik("");
      setYatisId("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["hemsire-gorevler"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const toggleMut = useMutation({
    mutationFn: async (id: number) => api.patch(`/yatis/gorevler/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hemsire-gorevler"] }),
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const bekleyen = gorevler.filter((g) => !g.tamamlandi_mi).length;
  const tamamlanan = gorevler.filter((g) => g.tamamlandi_mi).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Görev Listesi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bekleyen: {bekleyen} · Tamamlanan: {tamamlanan}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-2 items-end">
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Görev</span>
          <Input value={baslik} onChange={(e) => setBaslik(e.target.value)} />
        </label>
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Hasta (opsiyonel)</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={yatisId}
            onChange={(e) => setYatisId(e.target.value)}
          >
            <option value="">—</option>
            {yatislar.map((y) => (
              <option key={y.id} value={y.id}>
                {y.hasta_ad_soyad} ({y.protokol_no})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Son tarih</span>
          <Input
            type="datetime-local"
            value={sonTarih}
            onChange={(e) => setSonTarih(e.target.value)}
          />
        </label>
        <Button
          disabled={!baslik || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          Ekle
        </Button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {gorevler.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
            >
              <div>
                <p className={g.tamamlandi_mi ? "line-through text-muted-foreground" : ""}>
                  {g.baslik}
                </p>
                <p className="text-xs text-muted-foreground">
                  Son: {new Date(g.son_tarih).toLocaleString("tr-TR")}
                  {g.yatis_id ? ` · Yatış #${g.yatis_id}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant={g.tamamlandi_mi ? "outline" : "default"}
                onClick={() => toggleMut.mutate(g.id)}
              >
                {g.tamamlandi_mi ? "Geri al" : "Tamamla"}
              </Button>
            </li>
          ))}
          {!gorevler.length && (
            <li className="text-muted-foreground text-sm">Görev yok</li>
          )}
        </ul>
      )}
    </div>
  );
}
