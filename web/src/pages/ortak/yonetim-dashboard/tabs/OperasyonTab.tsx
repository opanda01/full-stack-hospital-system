import {
  BedDouble,
  CalendarDays,
  Scissors,
  Sparkles,
} from "lucide-react";
import { DashboardSection, QuickLinkGrid } from "@/shared/ui/dashboard";
import { useYonetimDashboardData } from "@/features/dashboard/hooks/useYonetimDashboardData";

type Props = { root: "/mudur" | "/bashekim" };

export function YonetimDashboardOperasyonTab({ root }: Props) {
  const { acikTemizlik, loading } = useYonetimDashboardData(root);

  return (
    <DashboardSection
      title="Operasyon modülleri"
      description="Günlük tesis ve servis operasyonları"
    >
      <QuickLinkGrid
        items={[
          {
            label: "Randevular",
            to: `${root}/randevular`,
            icon: CalendarDays,
          },
          {
            label: "Yatak yönetimi",
            to: `${root}/yatak-yonetimi`,
            icon: BedDouble,
          },
          {
            label: "Nöbet çizelgesi",
            to: `${root}/nobet`,
            icon: CalendarDays,
          },
          {
            label: "Temizlik görevleri",
            to: `${root}/temizlik`,
            icon: Sparkles,
            badge: !loading && acikTemizlik > 0 ? String(acikTemizlik) : undefined,
          },
          {
            label: "Ameliyathane",
            to: `${root}/ameliyathane`,
            icon: Scissors,
          },
        ]}
      />
    </DashboardSection>
  );
}
