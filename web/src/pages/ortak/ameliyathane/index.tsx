import { useState } from "react";
import {
  useAmeliyatAksiyonlari,
  useAmeliyatPlanlari,
} from "@/entities/ameliyat";
import { AmeliyatPlanlaForm } from "@/features/ameliyat-planla";
import { AmeliyathaneTakvimi } from "@/widgets/ameliyathane-takvimi";
import { Button } from "@/shared/ui";
import { formatIstanbulDateTime, getApiErrorMessage } from "@/shared/lib";
import { useAuthStore } from "@/shared/auth";

export function AmeliyathanePage() {
  const canPlanla = useAuthStore((s) =>
    s.hasPermission("ameliyat:planla") ||
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );
  const canGuncelle = useAuthStore((s) =>
    s.hasPermission("ameliyat:guncelle") ||
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );

  const { data: planlar = [], isLoading } = useAmeliyatPlanlari();
  const { baslat, tamamla } = useAmeliyatAksiyonlari();
  const [gorunum, setGorunum] = useState<"gun" | "hafta">("gun");
  const [err, setErr] = useState<string | null>(null);

  async function handleBaslat(id: number) {
    setErr(null);
    try {
      await baslat.mutateAsync(id);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  async function handleTamamla(id: number) {
    setErr(null);
    try {
      await tamamla.mutateAsync(id);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-semibold">Ameliyathane</h1>
        <p className="text-sm text-muted-foreground">
          Program, planlama ve ameliyat akışı
        </p>
      </header>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={gorunum === "gun" ? "default" : "outline"}
          onClick={() => setGorunum("gun")}
        >
          Günlük
        </Button>
        <Button
          type="button"
          variant={gorunum === "hafta" ? "default" : "outline"}
          onClick={() => setGorunum("hafta")}
        >
          Haftalık
        </Button>
      </div>

      <AmeliyathaneTakvimi haftalik={gorunum === "hafta"} />

      {canPlanla ? <AmeliyatPlanlaForm /> : null}

      <section className="corporate-panel rounded-lg p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
          Planlı ameliyatlar
        </h2>
        {err ? <p className="mb-2 text-sm text-destructive">{err}</p> : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : (
          <ul className="space-y-2">
            {planlar.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{p.ameliyat_adi}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatIstanbulDateTime(p.planlanan_baslangic)} · {p.durum}
                  </span>
                </div>
                {canGuncelle ? (
                  <div className="flex gap-2">
                    {(p.durum === "PLANLANDI" || p.durum === "HAZIRLIK") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleBaslat(p.id)}
                      >
                        Başlat
                      </Button>
                    )}
                    {p.durum === "DEVAM_EDIYOR" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleTamamla(p.id)}
                      >
                        Tamamla
                      </Button>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
