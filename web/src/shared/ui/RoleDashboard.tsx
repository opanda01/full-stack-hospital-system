import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { useAuthStore } from "@/shared/auth";
import { MetricCard, type MetricCardRenk } from "@/shared/ui/app-shell/MetricCard";

export type DashboardMetric = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  renk?: MetricCardRenk;
  /** Tıklanınca gidilecek rota */
  to?: string;
  trend?: { direction?: "up" | "down"; label: string };
  statusBadge?: { label: string; variant?: "kritik" | "acil" | "beklemede" | "tamamlandi" | "iptal" };
};

type RoleDashboardProps = {
  metrics: DashboardMetric[];
  /** Özel alt panel; verilmezse kurumsal placeholder gösterilir */
  altPanel?: ReactNode;
};

function DashboardActivityPlaceholder() {
  return (
    <section
      className="rounded-lg corporate-panel"
      style={{ background: "var(--panel-inset-bg)" }}
    >
      <div
        className="flex items-center gap-2 border-b px-4 py-3 brand-header-panel"
        style={{
          borderColor: "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
        }}
      >
        <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-widest">
          Son Aktiviteler / Bekleyen İşlemler
        </h3>
      </div>
      <div className="divide-y divide-border px-4 py-2 text-sm">
        {[
          "Onay bekleyen tetkik sonuçları listelenecek",
          "Vardiya devir notları ve acil bildirimler",
          "Randevu ve yatış durum güncellemeleri",
        ].map((line) => (
          <p
            key={line}
            className="py-2.5 text-[color:var(--text-secondary)]"
          >
            {line}
          </p>
        ))}
      </div>
      <p className="border-t px-4 py-2 text-[10px] uppercase tracking-wide text-muted-foreground"
        style={{ borderColor: "color-mix(in srgb, var(--text-secondary) 12%, transparent)" }}
      >
        Canlı veri bağlantısı sonraki entegrasyon aşamasında etkinleştirilecektir.
      </p>
    </section>
  );
}

/** Ortak rol dashboard iskeleti — AppShell route tarafından sağlanır. */
export function RoleDashboard({ metrics, altPanel }: RoleDashboardProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const ad = currentUser?.ad ?? "Demo";
  const soyad = currentUser?.soyad ?? "Kullanıcı";

  return (
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">Gösterge Paneli</p>
        <h2 className="page-title mt-1">
          Hoş geldiniz, {ad} {soyad}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Özet göstergeler — karta tıklayarak ilgili sayfaya gidebilirsiniz
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            renk={m.renk ?? "notr"}
            to={m.to}
            trend={m.trend}
            statusBadge={m.statusBadge}
          />
        ))}
      </div>

      {altPanel ?? <DashboardActivityPlaceholder />}
    </div>
  );
}
