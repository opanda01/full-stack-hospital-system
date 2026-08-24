import { DashboardInsetList } from "@/shared/ui/dashboard";

type BekleyenIslerPanelProps = {
  sikayetler: { id: number; baslik?: string }[];
  randevular: { id: string; durum?: string }[];
  isLoading?: boolean;
};

export function BekleyenIslerPanel({
  sikayetler,
  randevular,
  isLoading,
}: BekleyenIslerPanelProps) {
  if (isLoading) {
    return (
      <p className="text-sm text-[color:var(--text-secondary)]">Yükleniyor…</p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[color:var(--text-primary)]">
          Son şikayet / öneriler
        </h3>
        <DashboardInsetList
          emptyMessage="Bekleyen kayıt yok."
          items={sikayetler.map((s) => ({
            id: String(s.id),
            primary: `#${s.id} ${s.baslik ?? "Şikayet / öneri"}`,
            to: "/admin/sikayet",
            actionLabel: "İncele",
          }))}
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[color:var(--text-primary)]">
          Bekleyen randevular
        </h3>
        <DashboardInsetList
          emptyMessage="Bekleyen randevu bulunamadı."
          items={randevular.map((r) => ({
            id: r.id,
            primary: `Randevu ${r.id.slice(0, 8)}… (${r.durum ?? "BEKLEMEDE"})`,
            to: "/admin/randevular",
            actionLabel: "Aç",
          }))}
        />
      </div>
    </div>
  );
}
