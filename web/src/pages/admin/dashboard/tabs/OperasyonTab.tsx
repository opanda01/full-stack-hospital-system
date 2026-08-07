import {
  BedDouble,
  CalendarDays,
  Scissors,
  Sparkles,
} from "lucide-react";
import { DashboardGrid, DashboardSection, QuickLinkGrid } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { renkKuyrukSayaci } from "@/shared/ui/app-shell/metricCardSemantics";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";

export function AdminDashboardOperasyonTab() {
  const { acikTemizlik, isLoading, ozet } = useAdminDashboardData();
  const bekleyenRandevu = ozet.data?.randevu_bekleyen ?? 0;

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Açık temizlik"
          value={isLoading ? "…" : acikTemizlik}
          icon={Sparkles}
          renk={renkKuyrukSayaci(acikTemizlik, isLoading)}
          emptyHint="Açık görev yok"
          to="/admin/temizlik"
        />
        <MetricCard
          label="Bekleyen randevu"
          value={isLoading ? "…" : bekleyenRandevu}
          icon={CalendarDays}
          renk={renkKuyrukSayaci(bekleyenRandevu, isLoading)}
          emptyHint="Bekleyen yok"
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
              badge: acikTemizlik > 0 ? String(acikTemizlik) : undefined,
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
