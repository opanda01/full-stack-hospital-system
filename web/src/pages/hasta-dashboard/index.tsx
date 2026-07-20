import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { RandevuIptalEtButton } from "@/features/randevu-iptal-et";
import type { Randevu } from "@/entities/randevu";

type Tetkik = {
  id: number;
  tetkik_turu: string;
  durum: string;
  sonuc_dosyasi: string | null;
};

export function HastaDashboardPage() {
  const { data: randevular = [] } = useQuery({
    queryKey: ["hasta-randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: tetkikler = [] } = useQuery({
    queryKey: ["hasta-tetkikler"],
    queryFn: async () => (await api.get<Tetkik[]>("/tetkikler/")).data,
  });

  return (
    <AppShell
      title="Hasta Paneli"
      links={[
        { to: "/hasta/randevu", label: "Randevu al" },
        { to: "/sikayet", label: "Şikayet / öneri" },
      ]}
    >
      <div className="mb-4">
        <Link to="/hasta/randevu">
          <Button type="button">Yeni randevu al</Button>
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Randevularım
        </h2>
        <ul className="space-y-2">
          {randevular.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-sm"
            >
              <span>
                #{r.id} — {new Date(r.tarih_saat).toLocaleString("tr-TR")} —{" "}
                {r.durum}
              </span>
              {r.durum !== "IPTAL" && r.durum !== "TAMAMLANDI" && (
                <RandevuIptalEtButton randevuId={r.id} />
              )}
            </li>
          ))}
          {randevular.length === 0 && (
            <p className="text-sm text-slate-500">Randevu yok.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tetkik sonuçlarım
        </h2>
        <ul className="space-y-2">
          {tetkikler.map((t) => (
            <li key={t.id} className="rounded border bg-white px-3 py-2 text-sm">
              #{t.id} {t.tetkik_turu} — {t.durum}
              {t.sonuc_dosyasi && (
                <p className="mt-1 text-slate-600">Sonuç: {t.sonuc_dosyasi}</p>
              )}
            </li>
          ))}
          {tetkikler.length === 0 && (
            <p className="text-sm text-slate-500">Tetkik yok.</p>
          )}
        </ul>
      </section>
    </AppShell>
  );
}
