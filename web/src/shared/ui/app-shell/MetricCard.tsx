import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { sayisalBosMu } from "./metricCardSemantics";

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
  /** Sayısal metrik yerine yönlendirme kartı (örn. nöbet çizelgesi) */
  variant?: "stat" | "action";
  /** action variant: alt satır metni */
  actionHint?: string;
  /** Sıfır sayıda gösterilecek yardımcı metin (kart yüksekliği korunur) */
  emptyHint?: string;
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
  variant = "stat",
  actionHint = "Görüntüle",
  emptyHint,
}: MetricCardProps) {
  const yukleniyor = value === "…";
  const bosSayac = variant === "stat" && !yukleniyor && sayisalBosMu(value);
  const effectiveRenk = bosSayac && emptyHint ? "success" : renk;

  const valueBlock =
    variant === "action" ? (
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--nav-active-bg)" }}
        >
          {actionHint}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden style={{ color: "var(--nav-active-bg)" }} />
      </div>
    ) : bosSayac && emptyHint ? (
      <p
        className="mt-1 flex min-h-[2rem] items-center gap-1.5 text-lg font-semibold leading-tight"
        style={{ color: "var(--status-tamamlandi-fg)" }}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>{emptyHint}</span>
      </p>
    ) : (
      <p
        className="mt-1 text-2xl font-semibold tabular-nums tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    );

  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-medium leading-snug"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </p>
        {valueBlock}
        {(trend || statusBadge) && variant === "stat" ? (
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
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                ) : trend.direction === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
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
        ) : null}
      </div>
      {Icon ? (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
          style={{
            background: "var(--panel-bg)",
            color: "var(--nav-active-bg)",
            borderColor: "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
          }}
          aria-hidden
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
      "block transition hover:border-[color:var(--border-accent)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-accent)] focus-visible:ring-offset-2",
    className,
  );
  const shellStyle = {
    background: RENK_BG[effectiveRenk],
    borderLeftColor: RENK_ACCENT[effectiveRenk],
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
