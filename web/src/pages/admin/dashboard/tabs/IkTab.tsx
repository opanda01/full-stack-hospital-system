import { Building2, IdCard, Stethoscope, UserCheck, Users } from "lucide-react";
import { DashboardGrid, DashboardSection, QuickLinkGrid } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";

export function AdminDashboardIkTab() {
  const { ozet, isLoading } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Toplam kullanıcı"
          value={isLoading ? "…" : (ozet.data?.kullanici_sayisi ?? 0)}
          icon={Users}
          renk="success"
          to="/admin/kullanicilar"
        />
        <MetricCard
          label="Personel"
          value={isLoading ? "…" : (ozet.data?.personel_sayisi ?? 0)}
          icon={IdCard}
          renk="accent"
          to="/admin/personel"
        />
        <MetricCard
          label="Aktif doktor"
          value={isLoading ? "…" : (ozet.data?.doktor_sayisi ?? 0)}
          icon={Stethoscope}
          renk="notr"
          to="/admin/doktorlar"
        />
        <MetricCard
          label="Departman"
          value={isLoading ? "…" : (ozet.data?.departman_sayisi ?? 0)}
          icon={Building2}
          renk="warning"
          to="/admin/departmanlar"
        />
      </DashboardGrid>

      <DashboardSection title="İnsan kaynakları ve erişim">
        <QuickLinkGrid
          items={[
            {
              label: "Kullanıcılar",
              to: "/admin/kullanicilar",
              icon: Users,
            },
            {
              label: "Erişim onayları",
              to: "/admin/erisim-onaylari",
              icon: UserCheck,
            },
            {
              label: "Personel",
              to: "/admin/personel",
              icon: IdCard,
            },
            {
              label: "Doktorlar",
              to: "/admin/doktorlar",
              icon: Stethoscope,
            },
            {
              label: "Departmanlar",
              to: "/admin/departmanlar",
              icon: Building2,
            },
          ]}
        />
      </DashboardSection>
    </div>
  );
}
