import { useMemo, useState } from "react";
import {
  useAmeliyathaneler,
  useAmeliyathaneTakvim,
  useAmeliyatPlanlari,
  type AmeliyathaneTakvimOgesi,
} from "@/entities/ameliyat";
import { formatIstanbulTime } from "@/shared/lib";

const SAATLER = Array.from({ length: 13 }, (_, i) => i + 7);

function gunIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function haftaGunleri(anchor: string): string[] {
  const start = new Date(`${anchor}T12:00:00`);
  const dow = start.getDay();
  const monday = new Date(start);
  monday.setDate(start.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return gunIso(d);
  });
}

function ogeSaat(oge: AmeliyathaneTakvimOgesi): number {
  const t = new Date(oge.planlanan_baslangic);
  return t.getHours() + t.getMinutes() / 60;
}

function planToOge(p: {
  id: number;
  ameliyat_adi: string;
  hasta_id: string;
  planlanan_baslangic: string;
  planlanan_sure_dk: number;
  durum: string;
  sorumlu_cerrah_id: number;
}): AmeliyathaneTakvimOgesi {
  return {
    ameliyat_plani_id: p.id,
    ameliyat_adi: p.ameliyat_adi,
    hasta_id: p.hasta_id,
    planlanan_baslangic: p.planlanan_baslangic,
    planlanan_sure_dk: p.planlanan_sure_dk,
    durum: p.durum,
    sorumlu_cerrah_id: p.sorumlu_cerrah_id,
  };
}

type Props = {
  haftalik?: boolean;
};

export function AmeliyathaneTakvimi({ haftalik = false }: Props) {
  const { data: ameliyathaneler = [], isLoading } = useAmeliyathaneler();
  const { data: tumPlanlar = [] } = useAmeliyatPlanlari();
  const [ameliyathaneId, setAmeliyathaneId] = useState<number | null>(null);
  const [gun, setGun] = useState(() => gunIso(new Date()));

  const aktifId = ameliyathaneId ?? ameliyathaneler[0]?.id ?? null;
  const { data: gunlukTakvim } = useAmeliyathaneTakvim(
    haftalik ? null : aktifId,
    gun,
  );

  const gunler = useMemo(
    () => (haftalik ? haftaGunleri(gun) : [gun]),
    [gun, haftalik],
  );

  const ogelerByGun: Record<string, AmeliyathaneTakvimOgesi[]> = useMemo(() => {
    if (!haftalik) {
      return { [gun]: gunlukTakvim?.ogeler ?? [] };
    }
    if (aktifId == null) return {};
    const out: Record<string, AmeliyathaneTakvimOgesi[]> = {};
    for (const g of gunler) out[g] = [];
    for (const p of tumPlanlar) {
      if (p.ameliyathane_id !== aktifId || p.durum === "IPTAL") continue;
      const pg = p.planlanan_baslangic.slice(0, 10);
      if (!out[pg]) continue;
      out[pg].push(planToOge(p));
    }
    return out;
  }, [haftalik, gun, gunlukTakvim, aktifId, tumPlanlar, gunler]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  }

  return (
    <section className="corporate-panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
        <label className="text-sm">
          Ameliyathane
          <select
            className="ml-2 rounded border bg-background px-2 py-1"
            value={aktifId ?? ""}
            onChange={(e) => setAmeliyathaneId(Number(e.target.value))}
          >
            {ameliyathaneler.map((a) => (
              <option key={a.id} value={a.id}>
                {a.ad}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Gün
          <input
            type="date"
            className="ml-2 rounded border bg-background px-2 py-1"
            value={gun}
            onChange={(e) => setGun(e.target.value)}
          />
        </label>
        <span className="text-xs text-muted-foreground">
          {haftalik ? "Haftalık Gantt" : "Günlük program"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="w-14 text-left">Saat</th>
              {gunler.map((g) => (
                <th key={g} className="min-w-[7rem] text-center">
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAATLER.map((saat) => (
              <tr key={saat}>
                <td className="tabular-nums text-muted-foreground">
                  {String(saat).padStart(2, "0")}:00
                </td>
                {gunler.map((g) => {
                  const items = (ogelerByGun[g] ?? []).filter((o) => {
                    const h = ogeSaat(o);
                    const span = o.planlanan_sure_dk / 60;
                    return h >= saat && h < saat + 1 + span - 0.01;
                  });
                  return (
                    <td
                      key={`${g}-${saat}`}
                      className="min-h-[2.5rem] border px-1 py-1 align-top"
                    >
                      <div className="flex flex-col gap-1">
                        {items.map((o) => (
                          <div
                            key={o.ameliyat_plani_id}
                            className="rounded bg-primary/15 px-1 py-0.5 text-xs"
                            title={`${o.ameliyat_adi} (${o.durum})`}
                          >
                            <span className="font-medium">
                              {formatIstanbulTime(o.planlanan_baslangic)}
                            </span>{" "}
                            {o.ameliyat_adi}
                            <span className="block text-muted-foreground">
                              {o.planlanan_sure_dk} dk
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
