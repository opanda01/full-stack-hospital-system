import { RandevuCard } from "@/entities/randevu";
import { useRandevular } from "@/entities/randevu";

export function RandevuTakvimi() {
  const { data = [], isLoading } = useRandevular();
  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  const sorted = [...data].sort(
    (a, b) =>
      new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
  );
  return (
    <ul className="space-y-2">
      {sorted.map((r) => (
        <li key={r.id}>
          <RandevuCard item={r} />
        </li>
      ))}
    </ul>
  );
}
