import {
  CalendarClock,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import { DashboardGrid, DashboardInsetList, DashboardSection } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { renkKuyrukSayaci } from "@/shared/ui/app-shell/metricCardSemantics";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";

export function AdminDashboardBekleyenlerTab() {
  const {
    ozet,
    isLoading,
    acikTemizlik,
    sikayetOzet,
    sikayetList,
    randevuBekleyenList,
  } = useAdminDashboardData();

  const bekleyenRandevu = ozet.data?.randevu_bekleyen ?? 0;
  const bekleyenSikayet = sikayetOzet.data?.bekleyen;
  const sikayetKartYukleniyor = sikayetOzet.isLoading;

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Bekleyen randevu"
          value={isLoading ? "…" : bekleyenRandevu}
          icon={CalendarClock}
          renk={renkKuyrukSayaci(bekleyenRandevu, isLoading)}
          emptyHint="Bekleyen yok"
          to="/admin/randevular"
          statusBadge={
            !isLoading && bekleyenRandevu > 0
              ? { label: "Aksiyon gerekli", variant: "beklemede" }
              : undefined
          }
        />
        <MetricCard
          label="Açık temizlik görevi"
          value={isLoading ? "…" : acikTemizlik}
          icon={Sparkles}
          renk={renkKuyrukSayaci(acikTemizlik, isLoading)}
          emptyHint="Açık görev yok"
          to="/admin/temizlik"
        />
        <MetricCard
          label="Şikayet / öneri"
          value={sikayetKartYukleniyor ? "…" : (bekleyenSikayet ?? 0)}
          icon={MessageSquareWarning}
          renk={renkKuyrukSayaci(bekleyenSikayet ?? 0, sikayetKartYukleniyor)}
          emptyHint="Bekleyen şikayet yok"
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
