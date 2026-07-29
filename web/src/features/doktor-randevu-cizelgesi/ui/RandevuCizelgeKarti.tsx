import { Link } from "react-router-dom";
import { Button } from "@/shared/ui";
import type { Randevu } from "@/entities/randevu";
import { randevuHastaAdi } from "@/entities/randevu";
import { RandevuIptalEtButton } from "@/features/randevu-iptal-et";

export function RandevuCizelgeKarti({ randevu }: { randevu: Randevu }) {
  return (
    <div
      className="rounded-md border px-2 py-1.5 text-xs shadow-sm"
      style={{
        borderColor: "color-mix(in srgb, var(--border-accent) 35%, var(--border))",
        background: "var(--card)",
      }}
    >
      <p className="truncate font-semibold leading-tight">
        {randevuHastaAdi(randevu)}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {randevu.durum === "BEKLEMEDE" && (
          <Button asChild size="sm" variant="outline" className="h-6 px-2 text-[10px]">
            <Link to={`/doktor/muayene?randevu=${randevu.id}`}>Muayene</Link>
          </Button>
        )}
        {randevu.durum !== "IPTAL" && (
          <RandevuIptalEtButton
            randevuId={randevu.id}
            tarihSaat={randevu.tarih_saat}
            durum={randevu.durum}
          />
        )}
      </div>
    </div>
  );
}