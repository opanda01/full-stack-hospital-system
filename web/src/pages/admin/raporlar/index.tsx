import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/shared/ui";
import { ChartCard } from "@/shared/ui/dashboard";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { exportRapor, type RaporTur } from "@/features/raporlar/api/raporApi";
import {
  useFinansRapor,
  useKlinikRapor,
  useRandevuRapor,
  useYatakRapor,
  useYatisRapor,
} from "@/features/raporlar/hooks/useRaporData";
import { useQuery } from "@tanstack/react-query";

const CHART_COLORS = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#4f46e5",
  "#15803d",
];

type TabId = "randevu" | "yatis" | "finans" | "klinik";

type Departman = { id: number; ad: string };

const TABS: { id: TabId; label: string }[] = [
  { id: "randevu", label: "Randevu" },
  { id: "yatis", label: "Yatış" },
  { id: "finans", label: "Finans" },
  { id: "klinik", label: "Klinik" },
];

export function AdminRaporlarPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const [tab, setTab] = useState<TabId>("randevu");
  const [baslangic, setBaslangic] = useState(monthAgo);
  const [bitis, setBitis] = useState(today);
  const [departmanId, setDepartmanId] = useState("");
  const [exporting, setExporting] = useState(false);

  const filtre = {
    baslangic,
    bitis,
    departman_id: departmanId ? Number(departmanId) : undefined,
  };

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const randevu = useRandevuRapor(filtre, tab === "randevu");
  const yatis = useYatisRapor(filtre, tab === "yatis");
  const yatak = useYatakRapor(tab === "yatis");
  const finans = useFinansRapor(filtre, tab === "finans");
  const klinik = useKlinikRapor(tab === "klinik");

  const activeQuery =
    tab === "randevu"
      ? randevu
      : tab === "yatis"
        ? yatis
        : tab === "finans"
          ? finans
          : klinik;

  const csvIndir = async (format: "csv" | "pdf") => {
    const tur: RaporTur =
      tab === "randevu"
        ? "randevu"
        : tab === "yatis"
          ? "yatis"
          : tab === "finans"
            ? "finans"
            : "klinik";
    setExporting(true);
    try {
      await exportRapor(tur, format, filtre);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell title="Raporlar" links={[{ to: roleRoot, label: "Ana" }]}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          {tab !== "klinik" && (
            <>
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
            </>
          )}
          {tab === "randevu" && (
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
          )}
          <button
            type="button"
            disabled={exporting}
            className="ml-auto rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            onClick={() => void csvIndir("csv")}
          >
            CSV indir
          </button>
          <button
            type="button"
            disabled={exporting}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            onClick={() => void csvIndir("pdf")}
          >
            PDF indir
          </button>
        </div>

        {activeQuery.isLoading ? (
          <p>Yükleniyor…</p>
        ) : activeQuery.isError ? (
          <p className="text-sm text-red-600" role="alert">
            {getApiErrorMessage(activeQuery.error)}
          </p>
        ) : (
          <>
            {tab === "randevu" && randevu.data && (
              <RandevuTab data={randevu.data} />
            )}
            {tab === "yatis" && yatis.data && yatak.data && (
              <YatisTab yatis={yatis.data} yatak={yatak.data} />
            )}
            {tab === "finans" && finans.data && <FinansTab data={finans.data} />}
            {tab === "klinik" && klinik.data && <KlinikTab data={klinik.data} />}
          </>
        )}
      </div>
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

function DagilimPie({
  title,
  data,
}: {
  title: string;
  data: { etiket: string; deger: number }[];
}) {
  const chartData = data.map((d) => ({ name: d.etiket, value: d.deger }));
  if (!chartData.length) {
    return (
      <ChartCard title={title}>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Veri yok
        </p>
      </ChartCard>
    );
  }
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function RandevuTab({
  data,
}: {
  data: {
    toplam: number;
    no_show: number;
    durum_dagilimi: { etiket: string; deger: number }[];
    gunluk_adet: { tarih: string; adet: number }[];
    departman_dagilimi: { etiket: string; deger: number }[];
  };
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OzetKart label="Toplam randevu" value={data.toplam} />
        <OzetKart label="No-show" value={data.no_show} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Günlük randevu trendi">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.gunluk_adet}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="adet"
                stroke="#0f766e"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <DagilimPie title="Durum dağılımı" data={data.durum_dagilimi} />
        <DagilimPie title="Departman dağılımı" data={data.departman_dagilimi} />
      </div>
    </div>
  );
}

function YatisTab({
  yatis,
  yatak,
}: {
  yatis: {
    aktif_yatis: number;
    ortalama_los_gun: number;
    servis_doluluk: {
      servis_adi: string;
      dolu: number;
      toplam: number;
      oran: number;
    }[];
    gunluk_yatis: { tarih: string; adet: number }[];
  };
  yatak: {
    dolu: number;
    bos: number;
    temizlik_bekleyen: number;
    arizali: number;
  };
}) {
  const servisChart = yatis.servis_doluluk.map((s) => ({
    name: s.servis_adi,
    dolu: s.dolu,
    bos: s.toplam - s.dolu,
  }));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OzetKart label="Aktif yatış" value={yatis.aktif_yatis} />
        <OzetKart label="Ort. LOS (gün)" value={yatis.ortalama_los_gun} />
        <OzetKart label="Yatak dolu" value={yatak.dolu} />
        <OzetKart label="Yatak boş" value={yatak.bos} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Günlük yatış">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={yatis.gunluk_yatis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="adet" stroke="#0369a1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Servis doluluk">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={servisChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="dolu" stackId="a" fill="#0f766e" name="Dolu" />
              <Bar dataKey="bos" stackId="a" fill="#94a3b8" name="Boş" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function FinansTab({
  data,
}: {
  data: {
    fatura_toplam: number;
    toplam_tutar: string;
    doner_gelir: string;
    doner_gider: string;
    fatura_durum_dagilimi: { etiket: string; deger: number }[];
  };
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OzetKart label="Fatura sayısı" value={data.fatura_toplam} />
        <OzetKart label="Toplam tutar" value={data.toplam_tutar} />
        <OzetKart label="Döner gelir" value={data.doner_gelir} />
        <OzetKart label="Döner gider" value={data.doner_gider} />
      </div>
      <DagilimPie title="Fatura durum dağılımı" data={data.fatura_durum_dagilimi} />
    </div>
  );
}

function KlinikTab({
  data,
}: {
  data: {
    sikayet_bekleyen: number;
    epikriz_onay_bekleyen: number;
    no_show_hasta: number;
    tetkik_durum_dagilimi: { etiket: string; deger: number }[];
    triyaj_renk_dagilimi: { etiket: string; deger: number }[];
  };
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <OzetKart label="Şikayet bekleyen" value={data.sikayet_bekleyen} />
        <OzetKart label="Epikriz onay bekleyen" value={data.epikriz_onay_bekleyen} />
        <OzetKart label="No-show hasta" value={data.no_show_hasta} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DagilimPie title="Tetkik durum" data={data.tetkik_durum_dagilimi} />
        <DagilimPie title="Triyaj renk" data={data.triyaj_renk_dagilimi} />
      </div>
    </div>
  );
}
