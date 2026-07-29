import type { Randevu } from "../model/types";
import { formatIstanbulDateTime } from "@/shared/lib";
import { durumToBadgeVariant } from "@/shared/lib/status-badge";
import { Badge } from "@/shared/ui/badge";

export function RandevuCard({ item }: { item: Randevu }) {
  return (
    <div
      className="rounded-md border border-l-4 bg-card px-3 py-2 text-sm corporate-panel"
      style={{ borderLeftColor: "var(--nav-active-bg)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Randevu #{item.id}</p>
        <Badge variant={durumToBadgeVariant(item.durum)}>{item.durum}</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">
        {formatIstanbulDateTime(item.tarih_saat)}
      </p>
    </div>
  );
}
