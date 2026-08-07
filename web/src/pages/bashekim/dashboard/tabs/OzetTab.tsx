import { useMemo } from "react";
import {
  Activity,
  CalendarClock,
  FlaskConical,
  MessageSquareWarning,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { DashboardGrid, DashboardSection } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useBashekimOzet } from "@/features/dashboard/hooks/useBashekimOzet";
import { getApiErrorMessage } from "@/shared/lib";

const ROOT = "/bashekim";

export function BashekimDashboardOzetTab() {
  const { data, isLoading, isError, error } = useBashekimOzet();

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "Bekleyen erişim",
        value: data.bekleyen_erisim,
        to: `${ROOT}/erisim-onaylari`,
        icon: UserCheck,
      },
      {
        label: "Bugünkü randevu",
        value: data.bugun_randevu,
        to: `${ROOT}/randevular`,
        icon: CalendarClock,
      },
      {
        label: "Açık şikayet",
        value: data.acik_sikayet,
        to: `${ROOT}/sikayet`,
        icon: MessageSquareWarning,
      },
      {
        label: "Bekleyen tetkik",
        value: data.bekleyen_tetkik,
        to: `${ROOT}/tetkikler`,
        icon: FlaskConical,
      },
      {
        label: "Açık temizlik",
        value: data.acik_temizlik,
        to: `${ROOT}/temizlik`,
        icon: Sparkles,
      },
      {
        label: "Klinik onay",
        value: data.bekleyen_klinik_onay,
        to: `${ROOT}/klinik-onaylar`,
        icon: Activity,
      },
    ];
  }, [data]);

  if (isError) {
    return (
      <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <div className="space-y-6">
      {data?.cached ? (
        <p className="text-xs text-[color:var(--text-secondary)]">
          Önbellek: {data.cache_ttl_sec}s
        </p>
      ) : null}
      <DashboardGrid cols="links">
        {cards.map((c, i) => (
          <MetricCard
            key={c.label}
            label={c.label}
            value={isLoading ? "…" : c.value}
            icon={c.icon}
            renk={(["success", "accent", "warning", "notr"] as const)[i % 4]}
            to={c.to}
          />
        ))}
      </DashboardGrid>

      <DashboardSection title="Son denetim">
        <ul className="space-y-1 text-sm">
          {(data?.son_denetim ?? []).map((d) => (
            <li
              key={d.id}
              className="rounded-lg border px-3 py-2 corporate-panel"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
              }}
            >
              <span className="font-medium">{d.aksiyon}</span>
              {d.zaman ? (
                <span className="ml-2 text-[color:var(--text-secondary)]">
                  {new Date(d.zaman).toLocaleString("tr-TR")}
                </span>
              ) : null}
            </li>
          ))}
          {!isLoading && !(data?.son_denetim ?? []).length ? (
            <li className="text-[color:var(--text-secondary)]">
              Denetim kaydı yok.
            </li>
          ) : null}
        </ul>
      </DashboardSection>
    </div>
  );
}
