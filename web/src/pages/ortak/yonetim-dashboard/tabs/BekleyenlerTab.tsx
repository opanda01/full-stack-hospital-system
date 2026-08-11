import {
  CalendarClock,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import { DashboardGrid, DashboardSection } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useYonetimDashboardData } from "@/features/dashboard/hooks/useYonetimDashboardData";
import { pageTotal } from "@/shared/lib";

type Props = { root: "/mudur" | "/bashekim" };

export function YonetimDashboardBekleyenlerTab({ root }: Props) {
  const { loading, bugunRandevu, acikTemizlik, sikayetPage } =
    useYonetimDashboardData(root);

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Bugünkü randevu"
          value={loading ? "…" : bugunRandevu}
          icon={CalendarClock}
          renk="accent"
          to={`${root}/randevular`}
        />
        <MetricCard
          label="Açık temizlik"
          value={loading ? "…" : acikTemizlik}
          icon={Sparkles}
          renk="warning"
          to={`${root}/temizlik`}
        />
        <MetricCard
          label="Şikayet / öneri"
          value={loading ? "…" : pageTotal(sikayetPage.data ?? [])}
          icon={MessageSquareWarning}
          renk="warning"
          to={`${root}/sikayet`}
        />
      </DashboardGrid>

      <DashboardSection title="Öncelikli takip">
        <p className="text-sm text-[color:var(--text-secondary)]">
          Randevu, temizlik ve şikayet modüllerinden güncel kayıtları inceleyin.
          Başhekim panelinde erişim onayı ve klinik onay sayıları Özet sekmesinde
          görüntülenir.
        </p>
      </DashboardSection>
    </div>
  );
}
