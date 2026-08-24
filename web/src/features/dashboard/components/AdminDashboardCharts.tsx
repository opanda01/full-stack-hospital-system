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
import { ChartCard } from "@/shared/ui/dashboard";
import type { AdminTrend } from "@/features/dashboard/hooks/useAdminDashboardData";

const CHART_COLOR = "#0f6e56";

function formatGun(tarih: string): string {
  const d = new Date(`${tarih}T12:00:00`);
  return d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" });
}

type AdminTrendChartProps = {
  data?: AdminTrend;
  isLoading?: boolean;
};

export function AdminTrendChart({ data, isLoading }: AdminTrendChartProps) {
  const chartData =
    data?.randevu_gunluk.map((d) => ({
      gun: formatGun(d.tarih),
      randevu: d.adet,
      yatis: data.yatis_gunluk.find((y) => y.tarih === d.tarih)?.adet ?? 0,
    })) ?? [];

  return (
    <ChartCard title="Haftalık randevu ve yatış" description="Son 7 gün">
      {isLoading ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Yükleniyor…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Veri yok.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-inset-bg)" />
            <XAxis dataKey="gun" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="randevu" name="Randevu" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="yatis" name="Yatış" fill="#0369a1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

type ServisDolulukChartProps = {
  rows?: { servis_adi: string; dolu: number; toplam: number; oran: number }[];
  isLoading?: boolean;
};

export function ServisDolulukChart({ rows, isLoading }: ServisDolulukChartProps) {
  const chartData =
    rows
      ?.filter((r) => r.toplam > 0)
      .map((r) => ({
        ad: r.servis_adi,
        dolu: r.dolu,
        bos: r.toplam - r.dolu,
        oran: Math.round(r.oran * 100),
      })) ?? [];

  return (
    <ChartCard title="Servis doluluk" description="Dolu yatak oranı (%)">
      {isLoading ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Yükleniyor…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Servis verisi yok.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-inset-bg)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="ad" width={90} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`%${v ?? 0}`, "Doluluk"]} />
            <Bar dataKey="oran" name="Doluluk" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

type YatakOzetChartProps = {
  dolu?: number;
  bos?: number;
  isLoading?: boolean;
};

export function YatakOzetChart({ dolu = 0, bos = 0, isLoading }: YatakOzetChartProps) {
  const pieData = [
    { name: "Dolu", value: dolu },
    { name: "Boş", value: bos },
  ].filter((d) => d.value > 0);

  return (
    <ChartCard title="Yatak durumu" description="Hastane geneli">
      {isLoading ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Yükleniyor…</p>
      ) : pieData.length === 0 ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Yatak kaydı yok.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              <Cell fill={CHART_COLOR} />
              <Cell fill="#94a3b8" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
