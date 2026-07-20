import type { Departman } from "../model/types";

export function DepartmanCard({ item }: { item: Departman }) {
  return (
    <div className="rounded border bg-white px-3 py-2 text-sm">
      <p className="font-medium">{item.ad}</p>
      <p className="text-slate-500">{item.kategori ?? "—"}</p>
    </div>
  );
}
