import type { Personel } from "../model/types";

export function PersonelCard({ item }: { item: Personel }) {
  return (
    <div className="rounded border bg-white px-3 py-2 text-sm">
      <p className="font-medium">{item.sicil_no}</p>
      <p className="text-slate-500">{item.unvan ?? "—"}</p>
    </div>
  );
}
