import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type OrderTip = "TETKIK" | "MAR" | "ILAC_TALEP";

type Tetkik = {
  id: number;
  hasta_id: number;
  tetkik_turu: string;
  durum: string;
};
type Mar = {
  id: number;
  yatis_id: number;
  hasta_id: number;
  hasta_ad_soyad: string;
  protokol_no: string;
  ilac_adi: string;
  doz: string | null;
  durum: string;
  planlanan_saat: string;
};
type TalepSatir = {
  talep_id: number;
  hasta_ad_soyad: string | null;
  urun_adi: string;
  istenen_miktar: number;
  durum: string;
  acil_mi?: boolean;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null };

type OrderRow = {
  tip: OrderTip;
  id: string;
  baslik: string;
  hasta: string;
  durum: string;
  meta?: string;
  rawId: number;
};

export function HemsireOrderTakipPage() {
  const qc = useQueryClient();
  const [tipFiltre, setTipFiltre] = useState<"" | OrderTip>("");
  const [err, setErr] = useState<string | null>(null);

  const { data: tetkikler = [] } = useQuery({
    queryKey: ["order-tetkikler"],
    queryFn: async () => (await api.get<Tetkik[]>("/tetkikler/")).data,
  });
  const { data: marlar = [] } = useQuery({
    queryKey: ["order-mar"],
    queryFn: async () =>
      (
        await api.get<Mar[]>("/yatis/ilac-uygulamalari", {
          params: { kapsam: "benim" },
        })
      ).data,
  });
  const { data: talepler = [] } = useQuery({
    queryKey: ["order-talep"],
    queryFn: async () =>
      (await api.get<TalepSatir[]>("/ilac-talepleri/satirlar")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-order"],
    queryFn: async () =>
      (await api.get<Hasta[]>("/hastalar/", { params: { kapsam: "yatan" } })).data,
  });

  const hastaLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of hastalar) {
      m.set(h.id, `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const rows: OrderRow[] = useMemo(() => {
    const out: OrderRow[] = [];
    for (const t of tetkikler) {
      out.push({
        tip: "TETKIK",
        id: `T-${t.id}`,
        baslik: t.tetkik_turu,
        hasta: hastaLabel.get(t.hasta_id) ?? `#${t.hasta_id}`,
        durum: t.durum,
        rawId: t.id,
      });
    }
    for (const m of marlar) {
      out.push({
        tip: "MAR",
        id: `M-${m.id}`,
        baslik: `${m.ilac_adi}${m.doz ? ` (${m.doz})` : ""}`,
        hasta: m.hasta_ad_soyad,
        durum: m.durum,
        meta: new Date(m.planlanan_saat).toLocaleString("tr-TR"),
        rawId: m.id,
      });
    }
    for (const s of talepler) {
      out.push({
        tip: "ILAC_TALEP",
        id: `I-${s.talep_id}-${s.urun_adi}`,
        baslik: s.urun_adi,
        hasta: s.hasta_ad_soyad ?? `Talep #${s.talep_id}`,
        durum: s.durum + (s.acil_mi ? " · ACİL" : ""),
        meta: `Talep #${s.talep_id}`,
        rawId: s.talep_id,
      });
    }
    return out;
  }, [tetkikler, marlar, talepler, hastaLabel]);

  const filtered = tipFiltre ? rows.filter((r) => r.tip === tipFiltre) : rows;

  const marMut = useMutation({
    mutationFn: async ({ id, durum }: { id: number; durum: string }) =>
      api.patch(`/yatis/ilac-uygulamalari/${id}/durum`, { durum }),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["order-mar"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Order Takibi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tetkik, MAR ve ilaç talep kuyruğu
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["", "TETKIK", "MAR", "ILAC_TALEP"] as const).map((t) => (
          <Button
            key={t || "all"}
            size="sm"
            variant={tipFiltre === t ? "default" : "outline"}
            onClick={() => setTipFiltre(t)}
          >
            {t || "Tümü"}
          </Button>
        ))}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Hasta</th>
              <th className="px-3 py-2">Açıklama</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2 font-medium">{r.tip}</td>
                <td className="px-3 py-2">{r.hasta}</td>
                <td className="px-3 py-2">
                  {r.baslik}
                  {r.meta && (
                    <span className="block text-xs text-muted-foreground">{r.meta}</span>
                  )}
                </td>
                <td className="px-3 py-2">{r.durum}</td>
                <td className="px-3 py-2">
                  {r.tip === "MAR" && r.durum === "BEKLIYOR" ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          marMut.mutate({ id: r.rawId, durum: "VERILDI" })
                        }
                      >
                        Verildi
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          marMut.mutate({ id: r.rawId, durum: "ATLANDI" })
                        }
                      >
                        Atlandı
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted-foreground">
                  Bekleyen order yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
