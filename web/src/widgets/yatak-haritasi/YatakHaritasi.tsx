import type { YatakOzet } from "@/entities/yatak";

const DURUM_STYLES: Record<string, string> = {
  BOS: "bg-emerald-500/90 text-white",
  DOLU: "bg-red-500/90 text-white",
  TEMIZLIK_BEKLIYOR: "bg-amber-400/90 text-gray-900",
  ARIZALI: "bg-gray-500 text-white",
};

const DURUM_LABEL: Record<string, string> = {
  BOS: "Boş",
  DOLU: "Dolu",
  TEMIZLIK_BEKLIYOR: "Temizlik",
  ARIZALI: "Arızalı",
};

type YatakHaritasiProps = {
  yataklar: YatakOzet[];
  seciliYatakId?: number | null;
  onYatakSec?: (yatak: YatakOzet) => void;
};

export function YatakHaritasi({
  yataklar,
  seciliYatakId,
  onYatakSec,
}: YatakHaritasiProps) {
  const odalar = new Map<string, YatakOzet[]>();
  for (const y of yataklar) {
    const key = y.oda_no ?? `oda-${y.oda_id}`;
    const list = odalar.get(key) ?? [];
    list.push(y);
    odalar.set(key, list);
  }

  return (
    <div className="space-y-4">
      {Array.from(odalar.entries()).map(([odaNo, beds]) => (
        <div key={odaNo} className="rounded-xl border border-[color:var(--border-subtle)] p-3">
          <p className="mb-2 text-sm font-medium text-[color:var(--text-secondary)]">
            Oda {odaNo}
          </p>
          <div className="flex flex-wrap gap-2">
            {beds.map((yatak) => {
              const durum = String(yatak.durum);
              const secili = seciliYatakId === yatak.id;
              return (
                <button
                  key={yatak.id}
                  type="button"
                  disabled={!onYatakSec}
                  onClick={() => onYatakSec?.(yatak)}
                  className={[
                    "min-w-[4.5rem] rounded-lg px-3 py-2 text-center text-sm font-medium shadow-sm transition",
                    DURUM_STYLES[durum] ?? "bg-gray-300",
                    secili ? "ring-2 ring-[color:var(--accent)] ring-offset-2" : "",
                    onYatakSec ? "cursor-pointer hover:opacity-90" : "cursor-default",
                  ].join(" ")}
                >
                  <div>{yatak.yatak_no}</div>
                  <div className="text-xs opacity-90">
                    {DURUM_LABEL[durum] ?? durum}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
