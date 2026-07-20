import type { Hasta } from "../model/types";

export function HastaCard({ item }: { item: Hasta }) {
  return (
    <div className="rounded border bg-white px-3 py-2 text-sm">
      <p className="font-medium">Hasta #{item.id}</p>
      <p className="text-slate-500">TC: {item.tc_kimlik_no}</p>
    </div>
  );
}
