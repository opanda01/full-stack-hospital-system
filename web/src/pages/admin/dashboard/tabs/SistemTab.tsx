import { BarChart3, Settings, Shield, FileSearch } from "lucide-react";
import { DashboardSection, QuickLinkGrid } from "@/shared/ui/dashboard";

export function AdminDashboardSistemTab() {
  return (
    <DashboardSection
      title="Sistem ve raporlama"
      description="Yapılandırma, yetkilendirme ve denetim araçları"
    >
      <QuickLinkGrid
        items={[
          {
            label: "Raporlar",
            to: "/admin/raporlar",
            icon: BarChart3,
            description: "Kurumsal raporlar ve dışa aktarma",
          },
          {
            label: "Ayarlar",
            to: "/admin/ayarlar",
            icon: Settings,
            description: "Sistem ve kurum ayarları",
          },
          {
            label: "RBAC / yetki matrisi",
            to: "/admin/rbac",
            icon: Shield,
            description: "Rol ve izin yönetimi",
          },
          {
            label: "Denetim kayıtları",
            to: "/admin/denetim",
            icon: FileSearch,
            description: "İşlem ve erişim denetimi",
          },
        ]}
      />
    </DashboardSection>
  );
}
