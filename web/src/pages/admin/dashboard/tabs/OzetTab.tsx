import {
  Building2,
  BarChart3,
  CalendarClock,
  CalendarDays,
  HeartPulse,
  MessageSquareWarning,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  DashboardGrid,
  DashboardInsetList,
  DashboardSection,
  QuickLinkGrid,
} from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import {
  renkEnvanter,
  renkKuyrukSayaci,
  renkNavigasyon,
} from "@/shared/ui/app-shell/metricCardSemantics";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";
import { pageTotal } from "@/shared/lib";

export function AdminDashboardOzetTab() {
  const {
    ozet,
    isLoading,
    hastaPage,
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
          label="Toplam kullanıcı"
          value={isLoading ? "…" : (ozet.data?.kullanici_sayisi ?? 0)}
          icon={Users}
          renk={renkEnvanter()}
          to="/admin/kullanicilar"
        />
        <MetricCard
          label="Aktif doktor"
          value={isLoading ? "…" : (ozet.data?.doktor_sayisi ?? 0)}
          icon={Stethoscope}
          renk={renkEnvanter()}
          to="/admin/doktorlar"
        />
        <MetricCard
          label="Departman"
          value={isLoading ? "…" : (ozet.data?.departman_sayisi ?? 0)}
          icon={Building2}
          renk={renkEnvanter()}
          to="/admin/departmanlar"
        />
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
          label="Hastalar"
          value={hastaPage.data ? pageTotal(hastaPage.data) : "…"}
          icon={HeartPulse}
          renk={renkEnvanter()}
          to="/admin/hastalar"
        />
        <MetricCard
          label="Nöbet çizelgesi"
          value=""
          variant="action"
          actionHint="Görüntüle"
          icon={CalendarDays}
          renk={renkNavigasyon()}
          to="/admin/nobet"
        />
        <MetricCard
          label="Açık temizlik"
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

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Öncelikli işler"
          description="Bekleyen randevu ve son şikayet / öneri kayıtları"
        >
          <DashboardInsetList
            emptyMessage="Şu an öncelikli bekleyen iş yok."
            items={[
              ...(randevuBekleyenList.data ?? []).slice(0, 3).map((r) => ({
                id: `r-${r.id}`,
                primary: `Randevu ${r.id.slice(0, 8)}…`,
                trailing: r.durum ?? "BEKLEMEDE",
              })),
              ...(sikayetList.data ?? []).slice(0, 3).map((s) => ({
                id: `s-${s.id}`,
                primary: `#${s.id} ${s.baslik ?? "Şikayet / öneri"}`,
                to: "/admin/sikayet",
                actionLabel: "İncele",
              })),
            ].slice(0, 5)}
          />
        </DashboardSection>

        <DashboardSection
          title="Hızlı erişim"
          description="Sık kullanılan yönetim ekranları"
        >
          <QuickLinkGrid
            items={[
              {
                label: "Randevular",
                to: "/admin/randevular",
                icon: CalendarClock,
                description: "Onay ve takvim",
              },
              {
                label: "Kullanıcılar",
                to: "/admin/kullanicilar",
                icon: Users,
                description: "Hesap ve rol yönetimi",
              },
              {
                label: "Temizlik",
                to: "/admin/temizlik",
                icon: Sparkles,
                description: "Görev atama ve takip",
                badge: acikTemizlik > 0 ? String(acikTemizlik) : undefined,
              },
              {
                label: "Raporlar",
                to: "/admin/raporlar",
                icon: BarChart3,
                description: "Kurumsal raporlar",
              },
            ]}
          />
        </DashboardSection>
      </div>
    </div>
  );
}
