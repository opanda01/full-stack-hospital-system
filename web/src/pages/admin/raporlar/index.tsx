import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Kullanici = { id: number; rol: string; aktif_mi: boolean };
type Doktor = { id: number; departman_id?: number | null };
type Departman = { id: number; ad: string; birim_ad?: string | null };
type Randevu = {
  id: number;
  durum: string;
  tarih_saat?: string;
  doktor_id?: number;
  departman_id?: number | null;
};
type Personel = { id: number; rol?: string | null };

const ROL_COLORS = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#4f46e5",
  "#15803d",
  "#0e7490",
  "#a16207",
  "#7c3aed",
  "#c2410c",
];

const OZET_COLORS = ["#0f766e", "#0369a1", "#b45309", "#be123c"];

function dayKey(iso?: string) {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function AdminRaporlarPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const [baslangic, setBaslangic] = useState(monthAgo);
  const [bitis, setBitis] = useState(today);
  const [departmanId, setDepartmanId] = useState("");

  const {
    data: kullanicilar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: personeller = [] } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  const doktorById = useMemo(() => {
    const map = new Map<number, Doktor>();
    for (const d of doktorlar) map.set(d.id, d);
    return map;
  }, [doktorlar]);

  const filteredRandevular = useMemo(() => {
    return randevular.filter((r) => {
      const day = dayKey(r.tarih_saat);
      if (day && (day < baslangic || day > bitis)) return false;
      if (departmanId) {
        const depId =
          r.departman_id ??
          (r.doktor_id != null
            ? (doktorById.get(r.doktor_id)?.departman_id ?? null)
            : null);
        if (String(depId ?? "") !== departmanId) return false;
      }
      return true;
    });
  }, [randevular, baslangic, bitis, departmanId, doktorById]);

  const filteredDepartmanlar = useMemo(() => {
    if (!departmanId) return departmanlar;
    return departmanlar.filter((d) => String(d.id) === departmanId);
  }, [departmanlar, departmanId]);

  const filteredDoktorlar = useMemo(() => {
    if (!departmanId) return doktorlar;
    return doktorlar.filter((d) => String(d.departman_id ?? "") === departmanId);
  }, [doktorlar, departmanId]);

  const rolDagilimi = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of kullanicilar) {
      counts.set(u.rol, (counts.get(u.rol) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [kullanicilar]);

  const randevuDurum = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filteredRandevular) {
      counts.set(r.durum, (counts.get(r.durum) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredRandevular]);

  const birimDagilimi = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of filteredDepartmanlar) {
      const key = d.birim_ad ?? "Birimsiz";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredDepartmanlar]);

  const ozetVeri = useMemo(
    () => [
      { name: "Personel", value: personeller.length },
      { name: "Doktor", value: filteredDoktorlar.length },
      { name: "Departman", value: filteredDepartmanlar.length },
      { name: "Kullanıcı", value: kullanicilar.length },
    ],
    [personeller, filteredDoktorlar, filteredDepartmanlar, kullanicilar],
  );

  const aktifKullanici = kullanicilar.filter((u) => u.aktif_mi).length;
  const aktifRandevu = filteredRandevular.filter(
    (r) => r.durum !== "IPTAL",
  ).length;
  const iptalRandevu = filteredRandevular.filter(
    (r) => r.durum === "IPTAL",
  ).length;

  const csvIndir = () => {
    const lines = [
      "metrik,deger",
      `filtre_baslangic,${baslangic}`,
      `filtre_bitis,${bitis}`,
      `filtre_departman_id,${departmanId || "hepsi"}`,
      `kullanici_aktif,${aktifKullanici}`,
      `kullanici_toplam,${kullanicilar.length}`,
      `personel,${personeller.length}`,
      `doktor,${filteredDoktorlar.length}`,
      `departman,${filteredDepartmanlar.length}`,
      `randevu_aktif,${aktifRandevu}`,
      `randevu_iptal,${iptalRandevu}`,
      ...rolDagilimi.map((r) => `rol_${r.name},${r.value}`),
      ...randevuDurum.map((r) => `randevu_durum_${r.name},${r.value}`),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hastane-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Raporlar" links={[{ to: roleRoot, label: "Ana" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Başlangıç</span>
              <input
                type="date"
                className="block rounded-md border border-border px-3 py-2"
                value={baslangic}
                onChange={(e) => setBaslangic(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Bitiş</span>
              <input
                type="date"
                className="block rounded-md border border-border px-3 py-2"
                value={bitis}
                onChange={(e) => setBitis(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Departman</span>
              <select
                className="block min-w-[180px] rounded-md border border-border px-3 py-2"
                value={departmanId}
                onChange={(e) => setDepartmanId(e.target.value)}
              >
                <option value="">Tümü</option>
                {departmanlar.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ad}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="ml-auto rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={csvIndir}
            >
              CSV indir
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OzetKart
              label="Kullanıcı (aktif)"
              value={`${aktifKullanici} / ${kullanicilar.length}`}
            />
            <OzetKart label="Personel" value={personeller.length} />
            <OzetKart label="Doktor" value={filteredDoktorlar.length} />
            <OzetKart
              label="Randevu (aktif / iptal)"
              value={`${aktifRandevu} / ${iptalRandevu}`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Genel özet">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={ozetVeri}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Adet" radius={[4, 4, 0, 0]}>
                    {ozetVeri.map((_, i) => (
                      <Cell
                        key={i}
                        fill={OZET_COLORS[i % OZET_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Randevu durumları (filtreli)">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={randevuDurum}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {randevuDurum.map((_, i) => (
                      <Cell
                        key={i}
                        fill={ROL_COLORS[i % ROL_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Rol dağılımı">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={rolDagilimi}
                  margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Adet" radius={[4, 4, 0, 0]}>
                    {rolDagilimi.map((_, i) => (
                      <Cell
                        key={i}
                        fill={ROL_COLORS[i % ROL_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Birim bazlı departman">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={birimDagilimi}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name="Departman"
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function OzetKart({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
