import {
  CalendarClock,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import {
  AdminTrendChart,
  ServisDolulukChart,
  YatakOzetChart,
} from "@/features/dashboard/components/AdminDashboardCharts";
import { BekleyenIslerPanel } from "@/features/dashboard/components/BekleyenIslerPanel";
import { DASHBOARD_ESIKLERI } from "@/features/dashboard/config/dashboardEsikleri";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";
import { pageTotal } from "@/shared/lib";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import {
  renkEnvanter,
  renkKritik,
  renkKuyrukSayaci,
} from "@/shared/ui/app-shell/metricCardSemantics";
import { DashboardGrid, DashboardSection } from "@/shared/ui/dashboard";

function yuzdeMetni(bolum: number, toplam: number): string | undefined {
  if (toplam <= 0) return undefined;
  const pct = Math.round((bolum / toplam) * 100);
  return `%${pct} toplamın`;
}

export function AdminDashboardOzetTab() {
  const {
    ozet,
    isLoading,
    hastaPage,
    sikayetOzet,
    sikayetList,
    trend,
    servisDoluluk,
    analytics,
    randevuBekleyenList,
  } = useAdminDashboardData();

  const data = ozet.data;
  const randevuBekleyenToplam =
    (data?.randevu_bekleyen ?? 0) + (data?.randevu_onay_bekleyen ?? 0);
  const sikayetBekleyen = data?.sikayet_bekleyen ?? sikayetOzet.data?.bekleyen ?? 0;
  const temizlikAcik = data?.temizlik_acik ?? 0;
  const hastaSayisi = hastaPage.data ? pageTotal(hastaPage.data) : "…";

  return (
    <div className="space-y-6">
      <DashboardGrid cols="hero">
        <MetricCard
          label="Bekleyen randevu"
          value={isLoading ? "…" : randevuBekleyenToplam}
          icon={CalendarClock}
          size="hero"
          renk={renkKuyrukSayaci(
            randevuBekleyenToplam,
            isLoading,
            DASHBOARD_ESIKLERI.randevuBekleyen,
          )}
          to="/admin/randevular"
          trend={
            data?.randevu_toplam
              ? {
                  label: yuzdeMetni(randevuBekleyenToplam, data.randevu_toplam) ?? "",
                }
              : undefined
          }
          emptyHint="Bekleyen yok"
        />
        <MetricCard
          label="Bekleyen şikayet"
          value={isLoading ? "…" : sikayetBekleyen}
          icon={MessageSquareWarning}
          size="hero"
          renk={renkKritik(sikayetBekleyen, DASHBOARD_ESIKLERI.sikayetBekleyen)}
          to="/admin/sikayet"
          trend={
            sikayetOzet.data?.toplam
              ? {
                  label: `${sikayetBekleyen} / ${sikayetOzet.data.toplam} toplam`,
                }
              : undefined
          }
          emptyHint="Bekleyen yok"
        />
        <MetricCard
          label="Açık temizlik"
          value={isLoading ? "…" : temizlikAcik}
          icon={Sparkles}
          size="hero"
          renk={renkKuyrukSayaci(
            temizlikAcik,
            isLoading,
            DASHBOARD_ESIKLERI.temizlikAcik,
          )}
          to="/admin/temizlik"
          emptyHint="Tüm görevler tamam"
        />
      </DashboardGrid>

      <DashboardSection title="Genel istatistikler" description="Arka plan metrikleri">
        <DashboardGrid cols="compact">
          <MetricCard
            label="Toplam kullanıcı"
            value={isLoading ? "…" : (data?.kullanici_sayisi ?? 0)}
            size="compact"
            renk={renkEnvanter()}
            to="/admin/kullanicilar"
          />
          <MetricCard
            label="Aktif doktor"
            value={isLoading ? "…" : (data?.doktor_sayisi ?? 0)}
            size="compact"
            renk={renkEnvanter()}
            to="/admin/doktorlar"
          />
          <MetricCard
            label="Departman"
            value={isLoading ? "…" : (data?.departman_sayisi ?? 0)}
            size="compact"
            renk={renkEnvanter()}
            to="/admin/departmanlar"
          />
          <MetricCard
            label="Kayıtlı hasta"
            value={hastaSayisi}
            size="compact"
            renk={renkEnvanter()}
            to="/admin/hastalar"
          />
          <MetricCard
            label="Personel"
            value={isLoading ? "…" : (data?.personel_sayisi ?? 0)}
            size="compact"
            renk={renkEnvanter()}
            to="/admin/personel"
          />
        </DashboardGrid>
      </DashboardSection>

      <DashboardGrid cols="widgets">
        <AdminTrendChart data={trend.data} isLoading={trend.isLoading} />
        <ServisDolulukChart
          rows={servisDoluluk.data}
          isLoading={servisDoluluk.isLoading}
        />
        <YatakOzetChart
          dolu={analytics.data?.yatak_dolu ?? data?.yatak_dolu}
          bos={analytics.data?.yatak_bos ?? data?.yatak_bos}
          isLoading={analytics.isLoading || isLoading}
        />
      </DashboardGrid>

      <BekleyenIslerPanel
        sikayetler={sikayetList.data ?? []}
        randevular={randevuBekleyenList.data ?? []}
        isLoading={sikayetList.isLoading || randevuBekleyenList.isLoading}
      />
    </div>
  );
}
