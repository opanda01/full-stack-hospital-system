import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Button } from "@/shared/ui";
import {
  getPersonelImportDurum,
  startPersonelImport,
  type PersonelImportDurum,
} from "../api";

function isTerminal(durum: PersonelImportDurum["durum"]) {
  return durum === "TAMAMLANDI" || durum === "HATA";
}

export function PersonelImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isiId, setIsiId] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const { data: durum } = useQuery({
    queryKey: ["personel-import", isiId],
    queryFn: () => getPersonelImportDurum(isiId!),
    enabled: isiId != null,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d || isTerminal(d.durum)) return false;
      return 1500;
    },
  });

  const baslat = async (file: File) => {
    setHata(null);
    setYukleniyor(true);
    try {
      const res = await startPersonelImport(file);
      setIsiId(res.isi_id);
      await queryClient.invalidateQueries({ queryKey: ["personel"] });
    } catch (err) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setHata(
          typeof detail === "string" ? detail : "Import başlatılamadı",
        );
      } else {
        setHata(err instanceof Error ? err.message : "Import başlatılamadı");
      }
    } finally {
      setYukleniyor(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const progressPct =
    durum && durum.toplam > 0
      ? Math.round(
          ((durum.basarili + durum.basarisiz) / durum.toplam) * 100,
        )
      : 0;

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Toplu personel import</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        CSV veya XLSX: Ad, Soyad, TC Kimlik No, Sicil No, Rol, Departman,
        Telefon, Email. DOKTOR satırlarında uzmanlik_alani ve diploma_no
        zorunludur.
      </p>
      <div className="mt-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xlsm,text/csv"
          className="hidden"
          disabled={yukleniyor}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void baslat(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={yukleniyor}
          onClick={() => inputRef.current?.click()}
        >
          {yukleniyor ? "Yükleniyor…" : "CSV / XLSX seç"}
        </Button>
      </div>
      {hata && <p className="mt-2 text-xs text-red-600">{hata}</p>}

      {durum && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>İş #{durum.id}</span>
            <span>Durum: {durum.durum}</span>
            <span>
              {durum.basarili + durum.basarisiz}/{durum.toplam} işlendi
            </span>
            <span className="text-emerald-700">
              Başarılı: {durum.basarili}
            </span>
            <span className="text-red-700">Başarısız: {durum.basarisiz}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {isTerminal(durum.durum) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: ["personel"] })
              }
            >
              Listeyi yenile
            </Button>
          )}
          {durum.hata_detay && durum.hata_detay.length > 0 && (
            <ul className="max-h-40 overflow-y-auto rounded border border-border p-2 text-xs">
              {durum.hata_detay.slice(0, 50).map((row, i) => (
                <li
                  key={i}
                  className="border-b border-border/50 py-1 last:border-0"
                >
                  Satır {row.satir ?? "?"}: {row.hata ?? "Hata"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
