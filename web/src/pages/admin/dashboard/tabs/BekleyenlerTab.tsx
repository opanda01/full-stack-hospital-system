import {
  CalendarClock,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import { DASHBOARD_ESIKLERI } from "@/features/dashboard/config/dashboardEsikleri";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import {
  renkKritik,
  renkKuyrukSayaci,
} from "@/shared/ui/app-shell/metricCardSemantics";
import { DashboardGrid, DashboardSection } from "@/shared/ui/dashboard";
import { DashboardInsetList } from "@/shared/ui/dashboard/DashboardInsetList";

export function AdminDashboardBekleyenlerTab() {
  const {
    ozet,
    isLoading,
    sikayetOzet,
    sikayetList,
    randevuBekleyenList,
  } = useAdminDashboardData();

  const randevuBekleyen =
    (ozet.data?.randevu_bekleyen ?? 0) + (ozet.data?.randevu_onay_bekleyen ?? 0);
  const temizlikAcik = ozet.data?.temizlik_acik ?? 0;
  const sikayetBekleyen =
    ozet.data?.sikayet_bekleyen ?? sikayetOzet.data?.bekleyen ?? 0;

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Bekleyen randevu"
          value={isLoading ? "…" : randevuBekleyen}
          icon={CalendarClock}
          renk={renkKuyrukSayaci(
            randevuBekleyen,
            isLoading,
            DASHBOARD_ESIKLERI.randevuBekleyen,
          )}
          to="/admin/randevular"
          statusBadge={
            randevuBekleyen > 0
              ? { label: "Aksiyon gerekli", variant: "beklemede" }
              : undefined
          }
        />
        <MetricCard
          label="Açık temizlik görevi"
          value={isLoading ? "…" : temizlikAcik}
          icon={Sparkles}
          renk={renkKuyrukSayaci(
            temizlikAcik,
            isLoading,
            DASHBOARD_ESIKLERI.temizlikAcik,
          )}
          to="/admin/temizlik"
          emptyHint="Tüm görevler tamam"
        />
        <MetricCard
          label="Bekleyen şikayet"
          value={isLoading ? "…" : sikayetBekleyen}
          icon={MessageSquareWarning}
          renk={renkKritik(sikayetBekleyen, DASHBOARD_ESIKLERI.sikayetBekleyen)}
          to="/admin/sikayet"
        />
      </DashboardGrid>

      <DashboardSection title="Son şikayet / öneriler">
        <DashboardInsetList
          emptyMessage="Bekleyen kayıt yok veya liste yükleniyor…"
          items={(sikayetList.data ?? []).map((s) => ({
            id: String(s.id),
            primary: `#${s.id} ${s.baslik ?? "Şikayet / öneri"}`,
            to: "/admin/sikayet",
            actionLabel: "İncele",
          }))}
        />
      </DashboardSection>

      <DashboardSection title="Bekleyen randevular (özet)">
        <DashboardInsetList
          emptyMessage="Bekleyen randevu bulunamadı."
          items={(randevuBekleyenList.data ?? []).map((r) => ({
            id: r.id,
            primary: `Randevu ${r.id.slice(0, 8)}…`,
            trailing: r.durum ?? "BEKLEMEDE",
          }))}
        />
      </DashboardSection>
    </div>
  );
}
