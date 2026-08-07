import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type DashboardSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardSection({
  title,
  description,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type DashboardGridProps = {
  children: ReactNode;
  className?: string;
  cols?: "metrics" | "links" | "widgets";
};

const COLS: Record<NonNullable<DashboardGridProps["cols"]>, string> = {
  metrics: "grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4",
  links: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  widgets: "grid gap-4 lg:grid-cols-2",
};

export function DashboardGrid({
  children,
  className,
  cols = "metrics",
}: DashboardGridProps) {
  return <div className={cn(COLS[cols], className)}>{children}</div>;
}
