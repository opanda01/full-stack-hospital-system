import {
  Activity,
  FlaskConical,
  MessageSquareWarning,
  UserCheck,
} from "lucide-react";
import { DashboardGrid } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useBashekimOzet } from "@/features/dashboard/hooks/useBashekimOzet";
import { getApiErrorMessage } from "@/shared/lib";

const ROOT = "/bashekim";

export function BashekimDashboardBekleyenlerTab() {
  const { data, isLoading, isError, error } = useBashekimOzet();

  if (isError) {
    return (
      <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
    );
  }

  const metrics = [
    {
      label: "Bekleyen erişim",
      value: data?.bekleyen_erisim ?? 0,
      icon: UserCheck,
      to: `${ROOT}/erisim-onaylari`,
      renk: "warning" as const,
    },
    {
      label: "Klinik onay",
      value: data?.bekleyen_klinik_onay ?? 0,
      icon: Activity,
      to: `${ROOT}/klinik-onaylar`,
      renk: "accent" as const,
    },
    {
      label: "Bekleyen tetkik",
      value: data?.bekleyen_tetkik ?? 0,
      icon: FlaskConical,
      to: `${ROOT}/tetkikler`,
      renk: "notr" as const,
    },
    {
      label: "Açık şikayet",
      value: data?.acik_sikayet ?? 0,
      icon: MessageSquareWarning,
      to: `${ROOT}/sikayet`,
      renk: "warning" as const,
    },
  ];

  return (
    <DashboardGrid>
      {metrics.map((m) => (
        <MetricCard
          key={m.label}
          label={m.label}
          value={isLoading ? "…" : m.value}
          icon={m.icon}
          renk={m.renk}
          to={m.to}
          statusBadge={
            !isLoading && m.value > 0
              ? { label: "İncele", variant: "beklemede" }
              : undefined
          }
        />
      ))}
    </DashboardGrid>
  );
}
