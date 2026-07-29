import { SearchableCombobox } from "@/shared/ui";
import type { HastaSecimModu } from "../hooks/useDoktorHastaSecim";
import type { ComboboxOption } from "@/shared/ui/searchable-combobox";

type DoktorHastaSecimFieldProps = {
  hastaModu: HastaSecimModu;
  onModuChange: (modu: HastaSecimModu) => void;
  hastaTarih: string;
  onTarihChange: (iso: string) => void;
  options: ComboboxOption[];
  value: string;
  onChange: (hastaId: string) => void;
  /** Varsayılan: hasta seçimi */
  mode?: "secim" | "filtre";
};

export function DoktorHastaSecimField({
  hastaModu,
  onModuChange,
  hastaTarih,
  onTarihChange,
  options,
  value,
  onChange,
  mode = "secim",
}: DoktorHastaSecimFieldProps) {
  const isFiltre = mode === "filtre";
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{isFiltre ? "Hasta filtre" : "Hasta"}</p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Hasta listesi kaynağı"
      >
        <button
          type="button"
          className={
            hastaModu === "gun"
              ? "rounded-md border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground"
              : "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
          }
          onClick={() => onModuChange("gun")}
        >
          Randevu günü
        </button>
        <button
          type="button"
          className={
            hastaModu === "tum"
              ? "rounded-md border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground"
              : "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
          }
          onClick={() => onModuChange("tum")}
        >
          Tüm hastalarım
        </button>
      </div>
      {hastaModu === "gun" ? (
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Randevu tarihi</span>
          <input
            type="date"
            className="w-full rounded-md border border-border px-3 py-2"
            value={hastaTarih}
            onChange={(e) => onTarihChange(e.target.value)}
          />
        </label>
      ) : null}
      <SearchableCombobox
        options={options}
        value={value}
        onChange={onChange}
        placeholder={
          isFiltre
            ? hastaModu === "gun"
              ? "Hasta seçin veya tüm günü listeleyin…"
              : "Hasta seçin veya tümünü listeleyin…"
            : hastaModu === "gun"
              ? "Saat veya hasta adı yazın…"
              : "Ad, TC veya hasta no ara…"
        }
        emptyLabel={
          hastaModu === "gun"
            ? isFiltre
              ? "Bu tarihte randevulu hasta yok."
              : "Bu tarihte randevulu hasta yok. «Tüm hastalarım» ile arayın."
            : isFiltre
              ? "Erişebildiğiniz hasta yok."
              : "Erişebildiğiniz hasta bulunamadı."
        }
      />
    </div>
  );
}
