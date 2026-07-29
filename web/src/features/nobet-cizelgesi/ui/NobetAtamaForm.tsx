import { Button } from "@/shared/ui";
import { VARDIYALAR, weekDays } from "../lib/week";
import type { NobetPersonel } from "../model/types";
import { personelTamEtiket } from "../lib/personel-label";

type NobetAtamaFormProps = {
  departmanId: number;
  haftaBaslangic: string;
  personeller: NobetPersonel[];
  pending?: boolean;
  initialTarih?: string;
  initialVardiya?: string;
  onSubmit: (body: {
    personel_id: number;
    departman_id: number;
    tarih: string;
    vardiya: string;
  }) => void;
};

export function NobetAtamaForm({
  departmanId,
  haftaBaslangic,
  personeller,
  pending,
  initialTarih = "",
  initialVardiya = "SABAH",
  onSubmit,
}: NobetAtamaFormProps) {
  const gunler = weekDays(haftaBaslangic);

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-lg border bg-[var(--panel-inset-bg)] p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const personel_id = Number(fd.get("personel_id"));
        const tarih = String(fd.get("tarih"));
        const vardiya = String(fd.get("vardiya"));
        if (!personel_id || !tarih || !vardiya) return;
        onSubmit({ personel_id, departman_id: departmanId, tarih, vardiya });
        e.currentTarget.reset();
      }}
    >
      <p className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Nöbet atama (form)
      </p>
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
        Personel
        <select
          name="personel_id"
          className="rounded-md border px-2 py-1.5 text-sm"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Seçin
          </option>
          {personeller.map((p) => (
            <option key={p.id} value={p.id}>
              {personelTamEtiket(p)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Tarih
        <select
          name="tarih"
          className="rounded-md border px-2 py-1.5 text-sm"
          required
          defaultValue={initialTarih || gunler[0]}
          key={`${departmanId}-${initialTarih}`}
        >
          {gunler.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Vardiya
        <select
          name="vardiya"
          className="rounded-md border px-2 py-1.5 text-sm"
          defaultValue={initialVardiya}
          key={`v-${initialVardiya}`}
        >
          {VARDIYALAR.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        Ata
      </Button>
    </form>
  );
}
