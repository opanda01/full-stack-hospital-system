import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/shared/api";

type Icd10Kod = { kod: string; aciklama: string };

const ICD_LINE = /^[A-Z][\dA-Z.]* — /;

function birlestir(icd: string[], free: string) {
  const parts = [...icd];
  const f = free.trim();
  if (f) parts.push(f);
  return parts.join("\n");
}

function ayir(value: string) {
  const lines = value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const icd = lines.filter((l) => ICD_LINE.test(l));
  const free = lines.filter((l) => !ICD_LINE.test(l)).join("\n");
  return { icd, free };
}

type Icd10TaniFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Tanı alanı — `/icd10` araması ile kod seçimi; metin `kod — açıklama` satırları olarak saklanır. */
export function Icd10TaniField({ value, onChange }: Icd10TaniFieldProps) {
  const { icd: icdSatirlar, free: serbestMetin } = useMemo(
    () => ayir(value),
    [value],
  );
  const [arama, setArama] = useState("");

  const { data: kodlar = [] } = useQuery({
    queryKey: ["icd10-ara", arama],
    enabled: arama.trim().length >= 2,
    queryFn: async () =>
      (
        await api.get<Icd10Kod[]>("/icd10/", {
          params: { q: arama.trim() },
        })
      ).data,
  });

  const kodEkle = (row: Icd10Kod) => {
    const line = `${row.kod} — ${row.aciklama}`;
    if (icdSatirlar.includes(line)) return;
    onChange(birlestir([...icdSatirlar, line], serbestMetin));
    setArama("");
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Tanı (ICD-10)</p>
      <input
        type="search"
        className="w-full rounded-md border border-border px-3 py-2 text-sm"
        placeholder="Kod veya açıklama ara (en az 2 karakter)…"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
      />
      {arama.trim().length >= 2 && (
        <ul className="max-h-40 overflow-y-auto rounded-md border border-border bg-card text-sm">
          {kodlar.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">Sonuç yok</li>
          ) : (
            kodlar.map((k) => (
              <li key={k.kod}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted"
                  onClick={() => kodEkle(k)}
                >
                  <span className="font-mono text-xs">{k.kod}</span> — {k.aciklama}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {icdSatirlar.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {icdSatirlar.map((line) => (
            <li
              key={line}
              className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs"
            >
              <span>{line}</span>
              <button
                type="button"
                className="text-red-600"
                aria-label="Kaldır"
                onClick={() =>
                  onChange(
                    birlestir(
                      icdSatirlar.filter((s) => s !== line),
                      serbestMetin,
                    ),
                  )
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        className="min-h-[72px] w-full rounded-md border border-border px-3 py-2 text-sm"
        placeholder="Ek tanı notu (serbest metin)"
        value={serbestMetin}
        onChange={(e) => onChange(birlestir(icdSatirlar, e.target.value))}
      />
    </div>
  );
}
