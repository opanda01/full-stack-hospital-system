import type { Doktor } from "../model/types";

export function DoktorCard({ item }: { item: Doktor }) {
  return (
    <div className="rounded border bg-white px-3 py-2 text-sm">
      <p className="font-medium">
        Doktor #{item.id} — {item.uzmanlik_alani}
      </p>
      <p className="text-slate-500">{item.diploma_no}</p>
    </div>
  );
}
