import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardGrid, DashboardSection } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type AnalyticsDagilim = { etiket: string; deger: number };

type AnalyticsOzet = {
  tetkik_durumlari: AnalyticsDagilim[];
  triyaj_renkleri: AnalyticsDagilim[];
  yatak_dolu: number;
  yatak_bos: number;
  no_show_hasta: number;
  outbox_hata: number;
};

const CHART_COLORS = ["#0f766e", "#0369a1", "#b45309", "#be123c", "#4f46e5", "#15803d"];

export function BashekimDashboardAnalyticsTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-analytics-ozet"],
    queryFn: async () =>
      (await api.get<AnalyticsOzet>("/dashboard/analytics/ozet")).data,
  });

  if (isError) {
    return (
      <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
    );
  }

  const yatakData = [
    { etiket: "Dolu", deger: data?.yatak_dolu ?? 0 },
    { etiket: "Boş", deger: data?.yatak_bos ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <DashboardGrid cols="links">
        <MetricCard
          label="No-show hasta"
          value={isLoading ? "…" : data?.no_show_hasta ?? 0}
          renk="warning"
        />
        <MetricCard
          label="Outbox hata"
          value={isLoading ? "…" : data?.outbox_hata ?? 0}
          renk="notr"
          to="/bashekim/entegrasyonlar"
        />
        <MetricCard
          label="Yatak dolu"
          value={isLoading ? "…" : data?.yatak_dolu ?? 0}
          renk="accent"
          to="/bashekim/yatak-yonetimi"
        />
        <MetricCard
          label="Yatak boş"
          value={isLoading ? "…" : data?.yatak_bos ?? 0}
          renk="success"
        />
      </DashboardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Tetkik durumları">
          {isLoading || !data?.tetkik_durumlari.length ? (
            <p className="text-sm text-muted-foreground">Veri yok.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.tetkik_durumlari}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="etiket" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="deger" name="Adet" fill="#0369a1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardSection>

        <DashboardSection title="Acil triyaj renkleri">
          {isLoading || !data?.triyaj_renkleri.length ? (
            <p className="text-sm text-muted-foreground">Triyaj kaydı yok.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.triyaj_renkleri}
                  dataKey="deger"
                  nameKey="etiket"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(props) => {
                    const p = props as { etiket?: string; deger?: number };
                    return `${p.etiket ?? ""}: ${p.deger ?? 0}`;
                  }}
                >
                  {data.triyaj_renkleri.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </DashboardSection>

        <DashboardSection title="Yatak doluluk">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yatakData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="etiket" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="deger" name="Yatak" radius={[4, 4, 0, 0]}>
                <Cell fill="#0f766e" />
                <Cell fill="#94a3b8" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DashboardSection>
      </div>
    </div>
  );
}
