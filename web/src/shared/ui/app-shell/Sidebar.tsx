import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { NavGroup } from "@/shared/config/nav-items";
import { InstitutionEmblem } from "@/shared/ui/InstitutionEmblem";
import { cn } from "@/shared/lib/utils";

const DEFAULT_HOSPITAL =
  "Devlet Hastanesi";
const DEFAULT_KURUM_ALT = "T.C. Sağlık Bakanlığı";
const APP_VERSION = "1.0";

type SidebarProps = {
  navGroups: NavGroup[];
  hastaneAdi?: string;
  kurumAltYazi?: string;
};

export function Sidebar({
  navGroups,
  hastaneAdi = DEFAULT_HOSPITAL,
  kurumAltYazi = DEFAULT_KURUM_ALT,
}: SidebarProps) {
  return (
    <aside
      className="sidebar-panel flex h-[calc(100vh-32px)] w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl text-[color:var(--text-primary)] corporate-panel"
      style={{ background: "var(--panel-bg)" }}
    >
      <div className="brand-header-panel-subtle shrink-0 px-4 pb-4 pt-4">
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20"
            aria-hidden
          >
            <InstitutionEmblem className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/75">
              {kurumAltYazi}
            </p>
            <p className="mt-1 text-xs font-semibold leading-snug text-white">
              {hastaneAdi}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`}>
            {group.label ? (
              <p
                className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-secondary)" }}
              >
                {group.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path.split("/").length <= 2}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors [&_svg]:shrink-0 [&_svg]:text-current",
                        isActive
                          ? "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]"
                          : "font-normal text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" stroke="currentColor" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="flex shrink-0 items-center gap-2 border-t px-4 py-3 text-[10px] uppercase tracking-wide"
        style={{
          borderColor: "color-mix(in srgb, var(--text-secondary) 18%, transparent)",
          color: "var(--text-secondary)",
        }}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Sürüm {APP_VERSION} · Güvenli Oturum
        </span>
      </div>
    </aside>
  );
}
