import { useMemo } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  HeartPulse,
  IdCard,
  MessageSquareWarning,
  Sparkles,
  Stethoscope,
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
import { useYonetimDashboardData } from "@/features/dashboard/hooks/useYonetimDashboardData";
import { pageTotal } from "@/shared/lib";

type Props = { root: "/mudur" | "/bashekim" };

export function YonetimDashboardOzetTab({ root }: Props) {
  const {
    loading,
    personelPage,
    doktorPage,
    departmanlar,
    randevular,
    bugunRandevu,
    sikayetOzet,
    sikayetList,
    acikTemizlik,
    hastaPage,
  } = useYonetimDashboardData(root);

  const bekleyenSikayet = sikayetOzet.data?.bekleyen;
  const sikayetKartYukleniyor = loading || sikayetOzet.isLoading;

  const oncelikliIsler = useMemo(() => {
    const bekleyenRandevular = (randevular.data ?? [])
      .filter(
        (r) => r.durum === "BEKLEMEDE" || r.durum === "ONAY_BEKLIYOR",
      )
      .slice(0, 3)
      .map((r) => ({
        id: `r-${r.id}`,
        primary: `Randevu ${r.id.slice(0, 8)}…`,
        trailing: r.durum,
      }));

    const sonSikayetler = (sikayetList.data ?? []).slice(0, 3).map((s) => ({
        id: `s-${s.id}`,
        primary: `#${s.id} ${s.baslik ?? "Şikayet / öneri"}`,
        to: `${root}/sikayet`,
        actionLabel: "İncele" as const,
      }));

    return [...bekleyenRandevular, ...sonSikayetler].slice(0, 5);
  }, [randevular.data, root, sikayetList.data]);

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Personel"
          value={loading ? "…" : pageTotal(personelPage.data ?? [])}
          icon={IdCard}
          renk={renkEnvanter()}
          to={`${root}/personel`}
        />
        <MetricCard
          label="Doktor"
          value={loading ? "…" : pageTotal(doktorPage.data ?? [])}
          icon={Stethoscope}
          renk={renkEnvanter()}
          to={`${root}/doktorlar`}
        />
        <MetricCard
          label="Departman"
          value={loading ? "…" : (departmanlar.data?.length ?? 0)}
          icon={Building2}
          renk={renkEnvanter()}
          to={`${root}/departmanlar`}
        />
        <MetricCard
          label="Bugünkü randevu"
          value={loading ? "…" : bugunRandevu}
          icon={CalendarClock}
          renk={renkKuyrukSayaci(bugunRandevu, loading)}
          emptyHint="Bugün randevu yok"
          to={`${root}/randevular`}
        />
        <MetricCard
          label="Hastalar"
          value={loading ? "…" : pageTotal(hastaPage.data ?? [])}
          icon={HeartPulse}
          renk={renkEnvanter()}
          to={`${root}/hastalar`}
        />
        <MetricCard
          label="Nöbet çizelgesi"
          value=""
          variant="action"
          actionHint="Görüntüle"
          icon={CalendarDays}
          renk={renkNavigasyon()}
          to={`${root}/nobet`}
        />
        <MetricCard
          label="Açık temizlik"
          value={loading ? "…" : acikTemizlik}
          icon={Sparkles}
          renk={renkKuyrukSayaci(acikTemizlik, loading)}
          emptyHint="Açık görev yok"
          to={`${root}/temizlik`}
        />
        <MetricCard
          label="Şikayet / öneri"
          value={sikayetKartYukleniyor ? "…" : (bekleyenSikayet ?? 0)}
          icon={MessageSquareWarning}
          renk={renkKuyrukSayaci(bekleyenSikayet ?? 0, sikayetKartYukleniyor)}
          emptyHint="Bekleyen şikayet yok"
          to={`${root}/sikayet`}
        />
      </DashboardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Öncelikli işler"
          description="Bekleyen randevu ve son şikayet / öneri kayıtları"
        >
          <DashboardInsetList
            emptyMessage="Şu an öncelikli bekleyen iş yok."
            items={oncelikliIsler}
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
                to: `${root}/randevular`,
                icon: CalendarClock,
                description: "Günlük takvim ve onay",
              },
              {
                label: "Personel",
                to: `${root}/personel`,
                icon: IdCard,
                description: "Personel kayıtları",
              },
              {
                label: "Temizlik",
                to: `${root}/temizlik`,
                icon: Sparkles,
                description: "Görev atama ve takip",
                badge: acikTemizlik > 0 ? String(acikTemizlik) : undefined,
              },
              {
                label: "Raporlar",
                to: `${root}/raporlar`,
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
