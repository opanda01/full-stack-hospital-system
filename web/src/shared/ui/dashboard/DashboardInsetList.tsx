import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

export type DashboardInsetListItem = {
  id: string;
  primary: ReactNode;
  trailing?: ReactNode;
  to?: string;
  actionLabel?: string;
};

type DashboardInsetListProps = {
  items: DashboardInsetListItem[];
  emptyMessage: string;
  className?: string;
};

export function DashboardInsetList({
  items,
  emptyMessage,
  className,
}: DashboardInsetListProps) {
  return (
    <ul
      className={cn(
        "divide-y rounded-lg border text-sm corporate-panel",
        className,
      )}
      style={{
        background: "var(--panel-inset-bg)",
        borderColor:
          "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
      }}
    >
      {items.length === 0 ? (
        <li className="px-4 py-3 text-[color:var(--text-secondary)]">
          {emptyMessage}
        </li>
      ) : (
        items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="min-w-0 truncate text-[color:var(--text-primary)]">
              {item.primary}
            </span>
            {item.to && item.actionLabel ? (
              <Link
                to={item.to}
                className="shrink-0 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.actionLabel}
              </Link>
            ) : (
              <span className="shrink-0 text-xs text-[color:var(--text-secondary)]">
                {item.trailing}
              </span>
            )}
          </li>
        ))
      )}
    </ul>
  );
}
