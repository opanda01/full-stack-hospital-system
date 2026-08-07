import { Network, Pill, Receipt, Wallet } from "lucide-react";
import { DashboardSection, QuickLinkGrid } from "@/shared/ui/dashboard";

const ROOT = "/bashekim";

export function BashekimDashboardKurumsalTab() {
  return (
    <DashboardSection
      title="Kurumsal modüller"
      description="MHRS, entegrasyon, eczane ve mali işlemler"
    >
      <QuickLinkGrid
        items={[
          {
            label: "MHRS kapasite",
            to: `${ROOT}/mhrs-kapasite`,
            icon: Network,
          },
          {
            label: "Entegrasyonlar",
            to: `${ROOT}/entegrasyonlar`,
            icon: Network,
          },
          {
            label: "Eczane",
            to: `${ROOT}/eczane`,
            icon: Pill,
          },
          {
            label: "Faturalandırma",
            to: `${ROOT}/faturalandirma`,
            icon: Receipt,
          },
          {
            label: "Döner sermaye",
            to: `${ROOT}/doner-sermaye`,
            icon: Wallet,
          },
        ]}
      />
    </DashboardSection>
  );
}
