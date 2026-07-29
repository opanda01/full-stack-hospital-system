import { useMemo } from "react";
import { gunEtiketi } from "@/features/nobet-cizelgesi/lib/week";
import {
  cellKey,
  randevularByCell,
  saatSatirlari,
  type CizelgePanel,
} from "../lib/grid";
import { RandevuCizelgeKarti } from "./RandevuCizelgeKarti";

type Props = {
  panel: CizelgePanel;
};

export function DoktorRandevuCizelgeTablosu({ panel }: Props) {
  const { baslik, gunler, randevular } = panel;

  const saatler = useMemo(() => saatSatirlari(randevular), [randevular]);
  const byCell = useMemo(() => randevularByCell(randevular), [randevular]);

  if (randevular.length === 0) {
    return (
      <section className="corporate-panel overflow-hidden rounded-lg">
        <div className="brand-header-panel border-b px-4 py-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide">{baslik}</h3>
        </div>
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Bu dönemde randevu yok.
        </p>
      </section>
    );
  }

  return (
    <section className="corporate-panel overflow-hidden rounded-lg">
      <div className="brand-header-panel border-b px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide">{baslik}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-16 text-left">Saat</th>
              {gunler.map((g) => (
                <th key={g} className="min-w-[8rem] text-center">
                  {gunEtiketi(g)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {saatler.map((saat) => (
              <tr key={saat}>
                <td className="whitespace-nowrap font-medium tabular-nums text-muted-foreground">
                  {saat}
                </td>
                {gunler.map((gun) => {
                  const items = byCell.get(cellKey(gun, saat)) ?? [];
                  return (
                    <td
                      key={`${gun}-${saat}`}
                      className="min-w-[8rem] border px-1 py-1 align-top"
                    >
                      <div className="flex min-h-[2.75rem] flex-col gap-1">
                        {items.length > 0 ? (
                          items.map((r) => (
                            <RandevuCizelgeKarti key={r.id} randevu={r} />
                          ))
                        ) : (
                          <span className="block px-1 py-2 text-xs text-muted-foreground">
                            —
                          </span>
                        )}
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
