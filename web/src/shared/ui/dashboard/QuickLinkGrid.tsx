import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { DashboardGrid } from "./DashboardSection";

export type QuickLinkItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
};

type QuickLinkGridProps = {
  items: QuickLinkItem[];
};

export function QuickLinkGrid({ items }: QuickLinkGridProps) {
  return (
    <DashboardGrid cols="links">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-start gap-3 rounded-lg border p-4 transition-colors corporate-panel hover:border-[color:var(--nav-active-bg)]"
            style={{
              background: "var(--panel-inset-bg)",
              borderColor:
                "color-mix(in srgb, var(--text-secondary) 18%, transparent)",
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
              style={{
                background: "var(--nav-active-bg)",
                color: "var(--nav-active-text)",
              }}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[color:var(--text-primary)]">
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-xs text-[color:var(--text-secondary)] line-clamp-2">
                  {item.description}
                </p>
              ) : null}
            </div>
            <ChevronRight
              className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition group-hover:opacity-100"
              aria-hidden
            />
          </Link>
        );
      })}
    </DashboardGrid>
  );
}
