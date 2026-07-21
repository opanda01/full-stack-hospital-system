import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type MetricCardRenk = "success" | "accent" | "warning" | "notr";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  renk?: MetricCardRenk;
  className?: string;
};

const RENK_BG: Record<MetricCardRenk, string> = {
  success: "var(--card-success-bg)",
  accent: "var(--card-accent-bg)",
  warning: "var(--card-warning-bg)",
  notr: "var(--panel-inset-bg)",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  renk = "notr",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn("rounded-[20px] p-4", className)}
      style={{ background: RENK_BG[renk] }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
          <p
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </p>
        </div>
        {Icon ? (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{
              background: "var(--panel-bg)",
              color: "var(--nav-active-bg)",
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
