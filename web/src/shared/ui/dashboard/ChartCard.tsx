import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type ChartCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  description?: string;
};

export function ChartCard({ title, children, className, description }: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        className,
      )}
      style={{
        background: "var(--panel-bg)",
        borderColor: "color-mix(in srgb, var(--text-secondary) 12%, transparent)",
      }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
