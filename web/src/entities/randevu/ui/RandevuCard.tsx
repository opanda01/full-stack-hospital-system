import type { Randevu } from "../model/types";
import { formatIstanbulDateTime } from "@/shared/lib";

export function RandevuCard({ item }: { item: Randevu }) {
  return (
    <div className="rounded border bg-card px-3 py-2 text-sm">
      <p className="font-medium">
        Randevu #{item.id} — {item.durum}
      </p>
      <p className="text-muted-foreground">
        {formatIstanbulDateTime(item.tarih_saat)}
      </p>
    </div>
  );
}
