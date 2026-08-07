import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { NavGroup } from "@/shared/config/nav-items";
import { InstitutionEmblem } from "@/shared/ui/InstitutionEmblem";
import { cn } from "@/shared/lib/utils";

const DEFAULT_HOSPITAL = "Devlet Hastanesi";
const DEFAULT_KURUM_ALT = "T.C. Sağlık Bakanlığı";
const APP_VERSION = "1.0";

type SidebarProps = {
  navGroups: NavGroup[];
  hastaneAdi?: string;
  kurumAltYazi?: string;
  /** Dar bağlamsal menü (üst modül navigasyonu açıkken). */
  compact?: boolean;
  /** Marka üst şeritteyse sidebar başlığını gizle. */
  showBrand?: boolean;
};

export function Sidebar({
  navGroups,
  hastaneAdi = DEFAULT_HOSPITAL,
  kurumAltYazi = DEFAULT_KURUM_ALT,
  compact = false,
  showBrand = true,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "sidebar-panel flex shrink-0 flex-col overflow-hidden rounded-xl text-[color:var(--text-primary)] corporate-panel",
        compact ? "w-[200px]" : "w-[248px]",
      )}
      style={{
        background: "var(--panel-bg)",
        maxHeight: "calc(100vh - 4.5rem)",
      }}
    >
      {showBrand ? (
        <div className="brand-header-panel-subtle shrink-0 px-3 pb-3 pt-3">
          <div className="flex gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20"
              aria-hidden
            >
              <InstitutionEmblem className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/75 line-clamp-1">
                {kurumAltYazi}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-white line-clamp-2">
                {hastaneAdi}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p
          className="shrink-0 px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-secondary)" }}
        >
          Menü
        </p>
      )}

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
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
                        "flex items-center gap-2 rounded-md transition-colors [&_svg]:shrink-0 [&_svg]:text-current",
                        compact ? "px-2 py-1.5 text-xs" : "px-2.5 py-2 text-sm",
                        isActive
                          ? "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]"
                          : "font-normal text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]",
                      )
                    }
                  >
                    <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} stroke="currentColor" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 border-t uppercase tracking-wide",
          compact ? "px-2 py-2 text-[9px]" : "px-3 py-2.5 text-[10px]",
        )}
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
