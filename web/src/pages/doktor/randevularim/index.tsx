import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage, fetchAllPages } from "@/shared/lib";
import type { Randevu } from "@/entities/randevu";
import {
  DoktorRandevuCizelgeTablosu,
  buildDayRanges,
  cizelgePanelleri,
  matchesZaman,
  type ZamanDilimi,
} from "@/features/doktor-randevu-cizelgesi";
import {
  DoktorHastaSecimField,
  useDoktorHastaListeFiltresi,
} from "@/features/doktor-hasta-secim";

const ZAMAN: { value: ZamanDilimi; label: string }[] = [
  { value: "bugun", label: "Bugün" },
  { value: "yarin", label: "Yarın" },
  { value: "gelecek_hafta", label: "Gelecek hafta" },
  { value: "onumuzdeki_ay", label: "Gelecek ay" },
  { value: "gecmis", label: "Geçmiş" },
  { value: "hepsi", label: "Tümü" },
];

export function DoktorRandevularimPage() {
  const [zaman, setZaman] = useState<ZamanDilimi>("gelecek_hafta");
  const hastaFiltre = useDoktorHastaListeFiltresi("", {
    gunModuDaraltListe: false,
  });
  const [durumFiltre, setDurumFiltre] = useState("");

  const ranges = useMemo(() => buildDayRanges(), []);

  const {
    data: randevular = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => fetchAllPages<Randevu>("/randevular/"),
  });

  const baseFiltered = useMemo(() => {
    return randevular.filter((r) => {
      if (durumFiltre && r.durum !== durumFiltre) return false;
      return hastaFiltre.matchHastaId(r.hasta_id);
    });
  }, [randevular, durumFiltre, hastaFiltre.matchHastaId]);

  const zamanSayilari = useMemo(() => {
    const counts: Record<ZamanDilimi, number> = {
      hepsi: baseFiltered.length,
      bugun: 0,
      yarin: 0,
      gelecek_hafta: 0,
      onumuzdeki_ay: 0,
      gecmis: 0,
    };
    for (const r of baseFiltered) {
      for (const key of Object.keys(counts) as ZamanDilimi[]) {
        if (key === "hepsi") continue;
        if (matchesZaman(r.tarih_saat, key, ranges)) counts[key] += 1;
      }
    }
    return counts;
  }, [baseFiltered, ranges]);

  const filtered = useMemo(() => {
    return baseFiltered.filter((r) => matchesZaman(r.tarih_saat, zaman, ranges));
  }, [baseFiltered, zaman, ranges]);

  const paneller = useMemo(
    () =>
      cizelgePanelleri(filtered, zaman, ranges).filter(
        (p) => p.randevular.length > 0,
      ),
    [filtered, zaman, ranges],
  );

  const aktifZamanLabel =
    ZAMAN.find((z) => z.value === zaman)?.label ?? "Tümü";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Randevularım</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nöbet çizelgesi gibi gün ve saat ızgarasında randevularınız
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Zaman dilimi"
        >
          {ZAMAN.map((z) => {
            const active = zaman === z.value;
            const count = zamanSayilari[z.value];
            return (
              <button
                key={z.value}
                type="button"
                onClick={() => setZaman(z.value)}
                className={
                  active
                    ? "rounded-md border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                    : "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                }
              >
                {z.label}
                <span
                  className={
                    active ? "ml-1.5 opacity-80" : "ml-1.5 text-muted-foreground"
                  }
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <DoktorHastaSecimField
            mode="filtre"
            hastaModu={hastaFiltre.hastaModu}
            onModuChange={hastaFiltre.switchModu}
            hastaTarih={hastaFiltre.hastaTarih}
            onTarihChange={hastaFiltre.changeTarih}
            options={hastaFiltre.hastaSecenekleri}
            value={hastaFiltre.hastaId}
            onChange={hastaFiltre.setHastaId}
          />
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Durum</span>
            <select
              className="block w-full max-w-[200px] rounded-md border border-border bg-background px-3 py-2"
              value={durumFiltre}
              onChange={(e) => setDurumFiltre(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="BEKLEMEDE">BEKLEMEDE</option>
              <option value="TAMAMLANDI">TAMAMLANDI</option>
              <option value="IPTAL">IPTAL</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {aktifZamanLabel} için filtreye uyan randevu yok.
        </p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{aktifZamanLabel}</span>
            {" · "}
            {filtered.length} randevu
          </p>
          {paneller.map((panel) => (
            <DoktorRandevuCizelgeTablosu key={panel.baslik} panel={panel} />
          ))}
        </div>
      )}
    </div>
  );
}
