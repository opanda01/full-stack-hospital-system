import { Link } from "react-router-dom";
import {
  CalendarClock,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import { DashboardGrid, DashboardSection } from "@/shared/ui/dashboard";
import { MetricCard } from "@/shared/ui/app-shell/MetricCard";
import { useAdminDashboardData } from "@/features/dashboard/hooks/useAdminDashboardData";
import { pageTotal } from "@/shared/lib";

export function AdminDashboardBekleyenlerTab() {
  const {
    ozet,
    isLoading,
    acikTemizlik,
    sikayetPage,
    sikayetList,
    randevuBekleyenList,
  } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardGrid>
        <MetricCard
          label="Bekleyen randevu"
          value={isLoading ? "…" : (ozet.data?.randevu_bekleyen ?? 0)}
          icon={CalendarClock}
          renk="warning"
          to="/admin/randevular"
          statusBadge={
            (ozet.data?.randevu_bekleyen ?? 0) > 0
              ? { label: "Aksiyon gerekli", variant: "beklemede" }
              : undefined
          }
        />
        <MetricCard
          label="Açık temizlik görevi"
          value={acikTemizlik}
          icon={Sparkles}
          renk="accent"
          to="/admin/temizlik"
        />
        <MetricCard
          label="Şikayet / öneri"
          value={sikayetPage.data ? pageTotal(sikayetPage.data) : "…"}
          icon={MessageSquareWarning}
          renk="warning"
          to="/admin/sikayet"
        />
      </DashboardGrid>

      <DashboardSection title="Son şikayet / öneriler">
        <ul
          className="divide-y rounded-lg corporate-panel text-sm"
          style={{
            background: "var(--panel-inset-bg)",
            borderColor:
              "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
          }}
        >
          {(sikayetList.data ?? []).length === 0 ? (
            <li className="px-4 py-3 text-[color:var(--text-secondary)]">
              Bekleyen kayıt yok veya liste yükleniyor…
            </li>
          ) : (
            (sikayetList.data ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-2.5">
                <span>#{s.id} {s.baslik ?? "Şikayet / öneri"}</span>
                <Link
                  to="/admin/sikayet"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  İncele
                </Link>
              </li>
            ))
          )}
        </ul>
      </DashboardSection>

      <DashboardSection title="Bekleyen randevular (özet)">
        <ul
          className="divide-y rounded-lg corporate-panel text-sm"
          style={{ background: "var(--panel-inset-bg)" }}
        >
          {(randevuBekleyenList.data ?? []).length === 0 ? (
            <li className="px-4 py-3 text-[color:var(--text-secondary)]">
              Bekleyen randevu bulunamadı.
            </li>
          ) : (
            (randevuBekleyenList.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <span>Randevu {r.id.slice(0, 8)}…</span>
                <span className="text-xs text-[color:var(--text-secondary)]">
                  {r.durum ?? "BEKLEMEDE"}
                </span>
              </li>
            ))
          )}
        </ul>
      </DashboardSection>
    </div>
  );
}
