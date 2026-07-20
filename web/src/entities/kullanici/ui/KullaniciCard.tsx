import type { Kullanici } from "../model/types";

export function KullaniciCard({ item }: { item: Kullanici }) {
  return (
    <div className="rounded border bg-white px-3 py-2 text-sm">
      <p className="font-medium">
        {item.ad} {item.soyad}
      </p>
      <p className="text-slate-500">
        {item.email} — {item.rol}
      </p>
    </div>
  );
}
