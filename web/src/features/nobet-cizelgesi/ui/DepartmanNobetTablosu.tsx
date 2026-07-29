import { useMemo } from "react";

import type { NobetKaydi } from "../model/types";

import { VARDIYALAR, gunEtiketi, normalizeIsoDate, weekDays } from "../lib/week";

import { NobetHucre } from "./NobetHucre";

import { PersonelChip } from "./PersonelChip";



type DepartmanNobetTablosuProps = {

  departmanId: number;

  departmanAd: string;

  haftaBaslangic: string;

  nobetler: NobetKaydi[];

  canEdit: boolean;

  onEmptyCellClick?: (tarih: string, vardiya: string) => void;

  onDeleteNobet?: (id: number) => void;

  personelLabel?: (n: NobetKaydi) => string;

};



function cellKey(tarih: string, vardiya: string, sira: number) {

  return `${normalizeIsoDate(tarih)}|${vardiya}|${sira}`;

}



export function DepartmanNobetTablosu({

  departmanId,

  departmanAd,

  haftaBaslangic,

  nobetler,

  canEdit,

  onEmptyCellClick,

  onDeleteNobet,

  personelLabel,

}: DepartmanNobetTablosuProps) {

  const gunler = useMemo(() => weekDays(haftaBaslangic), [haftaBaslangic]);



  const byCell = useMemo(() => {

    const m = new Map<string, NobetKaydi>();

    for (const n of nobetler) {

      if (n.departman_id !== departmanId) continue;

      m.set(

        cellKey(n.tarih, n.vardiya, n.sira ?? 0),

        { ...n, tarih: normalizeIsoDate(n.tarih) },

      );

    }

    return m;

  }, [nobetler, departmanId]);



  return (

    <section className="corporate-panel overflow-hidden rounded-lg">

      <div className="brand-header-panel border-b px-4 py-2">

        <h3 className="text-sm font-semibold uppercase tracking-wide">

          {departmanAd}

        </h3>

      </div>

      <div className="overflow-x-auto">

        <table className="data-table w-full min-w-[640px] text-sm">

          <thead>

            <tr>

              <th className="w-20">Vardiya</th>

              {gunler.map((g) => (

                <th key={g} className="text-center">

                  {gunEtiketi(g)}

                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {VARDIYALAR.map((v) => (

              <tr key={v.id}>

                <td className="whitespace-nowrap font-medium text-muted-foreground">

                  {v.label}

                </td>

                {gunler.map((tarih) => {

                  const n = byCell.get(cellKey(tarih, v.id, 0));

                  return (

                    <NobetHucre
                      key={`${v.id}-${tarih}`}
                      departmanId={departmanId}
                      tarih={tarih}
                      vardiya={v.id}
                      canEdit={canEdit}
                      onEmptyActivate={
                        !n && canEdit && onEmptyCellClick
                          ? () => onEmptyCellClick(tarih, v.id)
                          : undefined
                      }
                    >

                      {n ? (

                        <div className="flex items-start gap-0.5">

                          <div className="min-w-0 flex-1">

                            <PersonelChip

                              personelId={n.personel_id}

                              nobetId={n.id}

                              label={

                                personelLabel?.(n) ??

                                n.personel_ad_soyad ??

                                `#${n.personel_id}`

                              }

                              disabled={!canEdit}

                            />

                          </div>

                          {canEdit && onDeleteNobet ? (

                            <button

                              type="button"

                              className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:text-destructive"

                              title="Nöbeti kaldır"

                              onClick={() => onDeleteNobet(n.id)}

                            >

                              ×

                            </button>

                          ) : null}

                        </div>

                      ) : canEdit ? (
                        <span className="pointer-events-none block px-1 py-1 text-xs text-muted-foreground">
                          + Ata
                        </span>
                      ) : (

                        <span className="block px-1 py-1 text-xs text-muted-foreground">

                          —

                        </span>

                      )}

                    </NobetHucre>

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

