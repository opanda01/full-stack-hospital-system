import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/shared/auth";
import { MetricCard, type MetricCardRenk } from "@/shared/ui/app-shell/MetricCard";

export type DashboardMetric = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  renk?: MetricCardRenk;
};

const RENK_SIRASI: MetricCardRenk[] = ["success", "accent", "warning", "notr"];

type RoleDashboardProps = {
  metrics: DashboardMetric[];
};

/** Ortak rol dashboard iskeleti — AppShell route tarafından sağlanır. */
export function RoleDashboard({ metrics }: RoleDashboardProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const ad = currentUser?.ad ?? "Demo";
  const soyad = currentUser?.soyad ?? "Kullanıcı";

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Hoş geldiniz, {ad} {soyad}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Özet göstergeler (örnek veri — Faz 2&apos;de bağlanacak)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            renk={m.renk ?? RENK_SIRASI[i % RENK_SIRASI.length]}
          />
        ))}
      </div>
    </div>
  );
}
