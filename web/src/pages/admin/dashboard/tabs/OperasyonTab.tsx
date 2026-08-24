import {
  BedDouble,
  CalendarDays,
  Scissors,
  Sparkles,
} from "lucide-react";
import { DASHBOARD_ESIKLERI } from "@/features/dashboard/config/dashboardEsikleri";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { renkKuyrukSayaci } from "@/shared/ui/app-shell/metricCardSemantics";
import { DashboardGrid, DashboardSection, QuickLinkGrid } from "@/shared/ui/dashboard";

export function AdminDashboardOperasyonTab() {
  const { isLoading, ozet } = useAdminDashboardData();

  const temizlikAcik = ozet.data?.temizlik_acik ?? 0;
  const randevuBekleyen =
    (ozet.data?.randevu_bekleyen ?? 0) + (ozet.data?.randevu_onay_bekleyen ?? 0);

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Açık temizlik"
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
          label="Bekleyen randevu"
          value={isLoading ? "…" : randevuBekleyen}
          icon={CalendarDays}
          renk={renkKuyrukSayaci(
            randevuBekleyen,
            isLoading,
            DASHBOARD_ESIKLERI.randevuBekleyen,
          )}
          to="/admin/randevular"
        />
      </DashboardGrid>

      <DashboardSection
        title="Operasyon modülleri"
        description="Tesis ve günlük operasyon ekranlarına hızlı erişim"
      >
        <QuickLinkGrid
          items={[
            {
              label: "Yatak yönetimi",
              to: "/admin/yatak-yonetimi",
              icon: BedDouble,
              description: "Servis yatak durumu ve yatış",
            },
            {
              label: "Nöbet çizelgesi",
              to: "/admin/nobet",
              icon: CalendarDays,
              description: "Personel nöbet planı",
            },
            {
              label: "Temizlik görevleri",
              to: "/admin/temizlik",
              icon: Sparkles,
              description: "Atama ve takip",
              badge: temizlikAcik > 0 ? String(temizlikAcik) : undefined,
            },
            {
              label: "Ameliyathane",
              to: "/admin/ameliyathane",
              icon: Scissors,
              description: "Ameliyat planı ve salonlar",
            },
          ]}
        />
      </DashboardSection>
    </div>
  );
}
