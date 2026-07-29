import { useMemo } from "react";
import { gunEtiketi, normalizeIsoDate, weekDays } from "../lib/cells";
import type { TemizlikGorev } from "../model/types";
import { TemizlikHucre } from "./TemizlikHucre";
import { TemizlikPersonelChip } from "./TemizlikPersonelChip";

type Props = {
  bolgeler: string[];
  haftaBaslangic: string;
  gorevler: TemizlikGorev[];
  canEdit: boolean;
};

function cellKey(oda: string, tarih: string) {
  return `${oda}|${normalizeIsoDate(tarih)}`;
}

export function TemizlikCizelgeTablosu({
  bolgeler,
  haftaBaslangic,
  gorevler,
  canEdit,
}: Props) {
  const gunler = useMemo(() => weekDays(haftaBaslangic), [haftaBaslangic]);

  const byCell = useMemo(() => {
    const m = new Map<string, TemizlikGorev>();
    for (const g of gorevler) {
      m.set(cellKey(g.oda_bolum, g.gorev_tarihi), g);
    }
    return m;
  }, [gorevler]);

  return (
    <section className="corporate-panel overflow-hidden rounded-lg">
      <div className="brand-header-panel border-b px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Haftalık temizlik çizelgesi
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="min-w-[10rem] text-left">Bölüm / oda</th>
              {gunler.map((g) => (
                <th key={g} className="text-center">
                  {gunEtiketi(g)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bolgeler.map((bolge) => (
              <tr key={bolge}>
                <td className="font-medium text-[color:var(--text-primary)]">
                  {bolge}
                </td>
                {gunler.map((tarih) => {
                  const g = byCell.get(cellKey(bolge, tarih));
                  return (
                    <TemizlikHucre
                      key={`${bolge}-${tarih}`}
                      odaBolum={bolge}
                      tarih={tarih}
                      canEdit={canEdit}
                    >
                      {g ? (
                        <TemizlikPersonelChip
                          personelId={g.personel_id}
                          gorevId={g.id}
                          label={g.personel_ad_soyad ?? `#${g.personel_id}`}
                          disabled={!canEdit}
                        />
                      ) : (
                        <span className="block px-1 py-1 text-xs text-muted-foreground">
                          {canEdit ? "—" : ""}
                        </span>
                      )}
                    </TemizlikHucre>
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
