import { DepartmanCard } from "@/entities/departman";
import { useDepartmanlar } from "@/entities/departman";

export function DepartmanListesi() {
  const { data = [], isLoading } = useDepartmanlar();
  if (isLoading) return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.id}>
          <DepartmanCard item={d} />
        </li>
      ))}
    </ul>
  );
}
