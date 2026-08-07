import { NavLink, useLocation } from "react-router-dom";
import type { NavDomain } from "@/shared/config/nav-domains";
import { resolveNavDomain } from "@/shared/config/nav-domains";
import { cn } from "@/shared/lib/utils";

type PrimaryNavProps = {
  domains: NavDomain[];
};

export function PrimaryNav({ domains }: PrimaryNavProps) {
  const { pathname } = useLocation();
  const active = resolveNavDomain(pathname, domains);

  return (
    <nav
      className="overflow-x-auto"
      aria-label="Ana modüller"
    >
      <div className="flex min-w-max gap-0.5 pb-0">
        {domains.map((domain) => {
          const Icon = domain.icon;
          const isActive = domain.id === active.id;
          const target =
            flattenFirstPath(domain) ?? domain.paths[0] ?? "/";

          return (
            <NavLink
              key={domain.id}
              to={target}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                isActive
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "text-[color:var(--text-secondary)] hover:bg-[color:var(--panel-inset-bg)] hover:text-[color:var(--text-primary)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{domain.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function flattenFirstPath(domain: NavDomain): string | undefined {
  for (const g of domain.groups) {
    if (g.items[0]) return g.items[0].path;
  }
  return domain.paths[0];
}
