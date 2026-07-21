import type { Doktor } from "../model/types";

export function DoktorCard({ item }: { item: Doktor }) {
  const ad = [item.ad, item.soyad].filter(Boolean).join(" ");
  return (
    <div className="rounded border bg-card px-3 py-2 text-sm">
      <p className="font-medium">
        {ad || `Doktor #${item.id}`} — {item.uzmanlik_alani}
      </p>
      <p className="text-muted-foreground">
        {item.diploma_no}
        {item.departman_ad ? ` · ${item.departman_ad}` : ""}
      </p>
    </div>
  );
}
