import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
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

type Kullanici = { id: number; rol: string; aktif_mi: boolean };
type Doktor = { id: number };
type Departman = { id: number; birim_ad?: string | null };
type Randevu = { id: number; durum: string };
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

export function AdminRaporlarPage() {
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
    for (const r of randevular) {
      counts.set(r.durum, (counts.get(r.durum) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [randevular]);

  const birimDagilimi = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of departmanlar) {
      const key = d.birim_ad ?? "Birimsiz";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [departmanlar]);

  const ozetVeri = useMemo(
    () => [
      { name: "Personel", value: personeller.length },
      { name: "Doktor", value: doktorlar.length },
      { name: "Departman", value: departmanlar.length },
      { name: "Kullanıcı", value: kullanicilar.length },
    ],
    [personeller, doktorlar, departmanlar, kullanicilar],
  );

  const aktifKullanici = kullanicilar.filter((u) => u.aktif_mi).length;
  const aktifRandevu = randevular.filter((r) => r.durum !== "IPTAL").length;
  const iptalRandevu = randevular.filter((r) => r.durum === "IPTAL").length;

  return (
    <AppShell title="Raporlar" links={[{ to: "/admin", label: "Admin" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OzetKart
              label="Kullanıcı (aktif)"
              value={`${aktifKullanici} / ${kullanicilar.length}`}
            />
            <OzetKart label="Personel" value={personeller.length} />
            <OzetKart label="Doktor" value={doktorlar.length} />
            <OzetKart label="Randevu (aktif / iptal)" value={`${aktifRandevu} / ${iptalRandevu}`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Genel özet">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ozetVeri} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Adet" radius={[4, 4, 0, 0]}>
                    {ozetVeri.map((_, i) => (
                      <Cell key={i} fill={OZET_COLORS[i % OZET_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Randevu durumları">
              {randevuDurum.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Randevu verisi yok.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={randevuDurum}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {randevuDurum.map((_, i) => (
                        <Cell key={i} fill={ROL_COLORS[i % ROL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Rol dağılımı">
              {rolDagilimi.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Veri yok.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    layout="vertical"
                    data={rolDagilimi}
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name="Kullanıcı" radius={[0, 4, 4, 0]}>
                      {rolDagilimi.map((_, i) => (
                        <Cell key={i} fill={ROL_COLORS[i % ROL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Birimlere göre departman">
              {birimDagilimi.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Veri yok.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={birimDagilimi}
                    margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Departman" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function OzetKart({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded border bg-card p-4">
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
    <section className="rounded border bg-card p-4">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}
