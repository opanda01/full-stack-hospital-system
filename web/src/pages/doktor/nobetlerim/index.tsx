import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NobetKaydi } from "@/features/nobet-cizelgesi";
import {
  gunEtiketi,
  mondayOfWeek,
  shiftWeek,
} from "@/features/nobet-cizelgesi/lib/week";
import {
  fetchAllPages,
  getApiErrorMessage,
} from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { durumToBadgeVariant } from "@/shared/lib/status-badge";
import { Button } from "@/shared/ui";

type Gorunum = "liste" | "hafta";

function fmtVardiya(v: string) {
  return v.replace(/_/g, " ");
}

export function DoktorNobetlerimPage() {
  const [gorunum, setGorunum] = useState<Gorunum>("liste");
  const [haftaBaslangic, setHaftaBaslangic] = useState(() => mondayOfWeek());

  const params = useMemo(() => {
    if (gorunum === "hafta") return { hafta_baslangic: haftaBaslangic };
    return {};
  }, [gorunum, haftaBaslangic]);

  const { data: nobetler = [], isLoading, isError, error } = useQuery({
    queryKey: ["doktor-nobetlerim", params],
    queryFn: () => fetchAllPages<NobetKaydi>("/nobet-cizelgesi/", params),
  });

  const { gelecek, gecmis } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gel: NobetKaydi[] = [];
    const gec: NobetKaydi[] = [];
    for (const n of nobetler) {
      const d = new Date(n.tarih);
      d.setHours(0, 0, 0, 0);
      if (d >= today) gel.push(n);
      else gec.push(n);
    }
    gel.sort((a, b) => a.tarih.localeCompare(b.tarih));
    gec.sort((a, b) => b.tarih.localeCompare(a.tarih));
    return { gelecek: gel, gecmis: gec };
  }, [nobetler]);

  const liste = gorunum === "liste" ? [...gelecek, ...gecmis] : nobetler;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Nöbetlerim</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Size atanmış nöbetler (salt okunur)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border p-0.5">
          <button
            type="button"
            className={
              gorunum === "liste"
                ? "rounded px-3 py-1.5 text-sm bg-primary text-primary-foreground"
                : "rounded px-3 py-1.5 text-sm hover:bg-muted"
            }
            onClick={() => setGorunum("liste")}
          >
            Liste
          </button>
          <button
            type="button"
            className={
              gorunum === "hafta"
                ? "rounded px-3 py-1.5 text-sm bg-primary text-primary-foreground"
                : "rounded px-3 py-1.5 text-sm hover:bg-muted"
            }
            onClick={() => setGorunum("hafta")}
          >
            Haftalık
          </button>
        </div>
        {gorunum === "hafta" && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Önceki hafta"
              onClick={() => setHaftaBaslangic((h) => shiftWeek(h, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[8rem] text-center text-sm">
              {gunEtiketi(haftaBaslangic)} haftası
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Sonraki hafta"
              onClick={() => setHaftaBaslangic((h) => shiftWeek(h, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm">Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : liste.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nöbet kaydı bulunamadı.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Tarih</th>
                <th className="px-3 py-2">Departman</th>
                <th className="px-3 py-2">Vardiya</th>
              </tr>
            </thead>
            <tbody>
              {gorunum === "liste" && gelecek.length > 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="bg-muted/30 px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground"
                  >
                    Yaklaşan
                  </td>
                </tr>
              )}
              {(gorunum === "liste" ? gelecek : liste).map((n) => (
                <tr key={n.id} className="border-b border-border">
                  <td className="px-3 py-2">{gunEtiketi(n.tarih)}</td>
                  <td className="px-3 py-2">{n.departman_ad ?? `#${n.departman_id}`}</td>
                  <td className="px-3 py-2">
                    <Badge variant={durumToBadgeVariant(n.vardiya)} className="normal-case">
                      {fmtVardiya(n.vardiya)}
                    </Badge>
                  </td>
                </tr>
              ))}
              {gorunum === "liste" && gecmis.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={3}
                      className="bg-muted/30 px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground"
                    >
                      Geçmiş
                    </td>
                  </tr>
                  {gecmis.map((n) => (
                    <tr key={n.id} className="border-b border-border text-muted-foreground">
                      <td className="px-3 py-2">{gunEtiketi(n.tarih)}</td>
                      <td className="px-3 py-2">{n.departman_ad ?? `#${n.departman_id}`}</td>
                      <td className="px-3 py-2">{fmtVardiya(n.vardiya)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
