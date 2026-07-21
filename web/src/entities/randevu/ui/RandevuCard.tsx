import type { Randevu } from "../model/types";

export function RandevuCard({ item }: { item: Randevu }) {
  return (
    <div className="rounded border bg-card px-3 py-2 text-sm">
      <p className="font-medium">
        Randevu #{item.id} — {item.durum}
      </p>
      <p className="text-muted-foreground">
        {new Date(item.tarih_saat).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}
