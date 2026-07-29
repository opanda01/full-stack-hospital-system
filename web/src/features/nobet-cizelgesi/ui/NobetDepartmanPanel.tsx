import { useMemo, useState } from "react";
import { DepartmanNobetTablosu } from "./DepartmanNobetTablosu";
import { NobetAtamaForm } from "./NobetAtamaForm";
import { PersonelChip } from "./PersonelChip";
import type { NobetKaydi, NobetPersonel } from "../model/types";
import { personelTamEtiket } from "../lib/personel-label";

type Props = {
  departmanId: number;
  departmanAd: string;
  haftaBaslangic: string;
  nobetler: NobetKaydi[];
  personeller: NobetPersonel[];
  canEdit: boolean;
  assignPending?: boolean;
  onAssign: (body: {
    personel_id: number;
    departman_id: number;
    tarih: string;
    vardiya: string;
  }) => void;
  onDeleteNobet?: (id: number) => void;
};

export function NobetDepartmanPanel({
  departmanId,
  departmanAd,
  haftaBaslangic,
  nobetler,
  personeller,
  canEdit,
  assignPending,
  onAssign,
  onDeleteNobet,
}: Props) {
  const [cellDraft, setCellDraft] = useState<{
    tarih: string;
    vardiya: string;
  } | null>(null);

  const depNobetler = useMemo(
    () => nobetler.filter((n) => n.departman_id === departmanId),
    [nobetler, departmanId],
  );

  const depPersonel = useMemo(() => {
    const inDep = personeller.filter((p) => p.departman_id === departmanId);
    if (inDep.length > 0) return inDep;
    return personeller;
  }, [personeller, departmanId]);

  return (
    <div className="space-y-4">
      {canEdit && (
        <NobetAtamaForm
          departmanId={departmanId}
          haftaBaslangic={haftaBaslangic}
          personeller={depPersonel}
          pending={assignPending}
          initialTarih={cellDraft?.tarih}
          initialVardiya={cellDraft?.vardiya}
          onSubmit={(body) => {
            onAssign(body);
            setCellDraft(null);
          }}
        />
      )}

      <DepartmanNobetTablosu
        departmanId={departmanId}
        departmanAd={departmanAd}
        haftaBaslangic={haftaBaslangic}
        nobetler={depNobetler}
        canEdit={canEdit}
        onEmptyCellClick={
          canEdit
            ? (tarih, vardiya) => setCellDraft({ tarih, vardiya })
            : undefined
        }
        onDeleteNobet={canEdit ? onDeleteNobet : undefined}
        personelLabel={(n) => {
          const p = personeller.find((x) => x.id === n.personel_id);
          if (p) return personelTamEtiket(p);
          return n.personel_ad_soyad ?? `#${n.personel_id}`;
        }}
      />

      {canEdit && (
        <div className="rounded-lg border bg-[var(--panel-inset-bg)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sürükle-bırak havuzu
          </p>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {depPersonel.map((p) => (
              <div key={p.id} className="w-44">
                <PersonelChip
                  personelId={p.id}
                  label={personelTamEtiket(p)}
                />
              </div>
            ))}
            {!depPersonel.length && (
              <span className="text-xs text-muted-foreground">
                Atanabilir personel yok.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
