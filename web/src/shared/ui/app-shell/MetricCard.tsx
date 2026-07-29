import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export type MetricCardRenk = "success" | "accent" | "warning" | "notr";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  renk?: MetricCardRenk;
  to?: string;
  className?: string;
  /** Örn. "+12%" veya "3 kritik" */
  trend?: { direction?: "up" | "down"; label: string };
  statusBadge?: { label: string; variant?: "kritik" | "acil" | "beklemede" | "tamamlandi" | "iptal" };
};

const RENK_BG: Record<MetricCardRenk, string> = {
  success: "var(--card-success-bg)",
  accent: "var(--card-accent-bg)",
  warning: "var(--card-warning-bg)",
  notr: "var(--panel-inset-bg)",
};

const RENK_ACCENT: Record<MetricCardRenk, string> = {
  success: "var(--status-tamamlandi-fg)",
  accent: "var(--nav-active-bg)",
  warning: "var(--status-beklemede-fg)",
  notr: "var(--status-iptal-fg)",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  renk = "notr",
  to,
  className,
  trend,
  statusBadge,
}: MetricCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </p>
        <p
          className="mt-1 text-2xl font-semibold tabular-nums tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </p>
        {(trend || statusBadge) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {trend ? (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-medium"
                style={{
                  color:
                    trend.direction === "down"
                      ? "var(--status-kritik-fg)"
                      : "var(--status-tamamlandi-fg)",
                }}
              >
                {trend.direction === "down" ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : trend.direction === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : null}
                {trend.label}
              </span>
            ) : null}
            {statusBadge ? (
              <Badge variant={statusBadge.variant ?? "beklemede"}>
                {statusBadge.label}
              </Badge>
            ) : null}
          </div>
        )}
      </div>
      {Icon ? (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
          style={{
            background: "var(--panel-bg)",
            color: "var(--nav-active-bg)",
            borderColor: "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );

  const shellClass = cn(
    "rounded-lg border border-transparent p-4",
    "border-l-4",
    to &&
      "block transition hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    className,
  );
  const shellStyle = {
    background: RENK_BG[renk],
    borderLeftColor: RENK_ACCENT[renk],
    outlineColor: "var(--border-accent)",
  } as const;

  if (to) {
    return (
      <Link to={to} className={shellClass} style={shellStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={shellClass} style={shellStyle}>
      {content}
    </div>
  );
}
