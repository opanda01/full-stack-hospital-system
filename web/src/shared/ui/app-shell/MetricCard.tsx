import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

export type MetricCardRenk = "success" | "accent" | "warning" | "notr";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  renk?: MetricCardRenk;
  to?: string;
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
  to,
  className,
}: MetricCardProps) {
  const content = (
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
  );

  const shellClass = cn(
    "rounded-[20px] p-4",
    to &&
      "block transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    className,
  );
  const shellStyle = {
    background: RENK_BG[renk],
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
