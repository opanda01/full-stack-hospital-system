import { PersonelCard } from "@/entities/personel";
import { usePersoneller } from "@/entities/personel";

export function PersonelTablosu() {
  const { data = [], isLoading } = usePersoneller();
  if (isLoading) return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((p) => (
        <PersonelCard key={p.id} item={p} />
      ))}
    </div>
  );
}
