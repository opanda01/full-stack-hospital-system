import {
  BedDouble,
  CalendarClock,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Randevu } from "@/entities/randevu";
import { randevuHastaAdi } from "@/entities/randevu";
import {
  buildDayRanges,
  matchesZaman,
} from "@/features/doktor-randevu-cizelgesi";
import { api } from "@/shared/api";
import {
  fetchAllPages,
  formatIstanbulDateTime,
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { durumToBadgeVariant } from "@/shared/lib/status-badge";
import { Badge } from "@/shared/ui/badge";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";
import { Button } from "@/shared/ui";

type DoktorOzet = {
  bugun_randevu: number;
  bekleyen_muayene: number;
  tamamlanan: number;
  bekleyen_tetkik: number;
  bekleyen_onay: number;
};

type Doktor = { id: number };

type YatisListeItem = { id: number };

type Epikriz = { id: number; durum: string };

type Konsultasyon = {
  id: number;
  hedef_doktor_id: number;
  durum: string;
};

export function DoktorDashboardPage() {
  const ranges = useMemo(() => buildDayRanges(), []);

  const { data: ozet } = useQuery({
    queryKey: ["dashboard-doktor-ozet"],
    queryFn: async () => (await api.get<DoktorOzet>("/dashboard/doktor/ozet")).data,
  });

  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });

  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => fetchAllPages<Randevu>("/randevular/"),
  });

  const bugunRandevular = useMemo(
    () =>
      randevular
        .filter(
          (r) =>
            r.durum !== "IPTAL" && matchesZaman(r.tarih_saat, "bugun", ranges),
        )
        .sort((a, b) => a.tarih_saat.localeCompare(b.tarih_saat))
        .slice(0, 5),
    [randevular, ranges],
  );

  const { data: yatisKayitlari = [] } = useQuery({
    queryKey: ["doktor-yatis-ozet", doktor?.id],
    enabled: doktor != null,
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<YatisListeItem>>("/yatis/kayitlar", {
            params: {
              aktif: "true",
              doktor_id: doktor!.id,
              page_size: LOOKUP_PAGE_SIZE,
            },
          })
        ).data,
      ),
  });

  const { data: epikrizler = [] } = useQuery({
    queryKey: ["doktor-epikriz-ozet"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Epikriz>>("/epikriz/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const { data: konsultasyonlar = [] } = useQuery({
    queryKey: ["konsultasyonlar"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Konsultasyon>>("/konsultasyonlar/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const bekleyenEpikriz = epikrizler.filter((e) => e.durum === "TASLAK").length;
  const bekleyenKons = useMemo(() => {
    if (!doktor) return 0;
    return konsultasyonlar.filter(
      (k) => k.hedef_doktor_id === doktor.id && k.durum === "BEKLEMEDE",
    ).length;
  }, [konsultasyonlar, doktor]);

  const metrics = [
    {
      label: "Bugünkü randevu",
      value: ozet?.bugun_randevu ?? "…",
      icon: CalendarClock,
      to: "/doktor/randevularim",
    },
    {
      label: "Aktif hastam",
      value: yatisKayitlari.length || (doktor ? 0 : "…"),
      icon: Users,
      to: "/doktor/hastalarim",
    },
    {
      label: "Bekleyen tetkik sonucu",
      value: ozet?.bekleyen_tetkik ?? "…",
      icon: FlaskConical,
      to: "/doktor/tetkiklerim",
    },
    {
      label: "Servisimdeki hasta",
      value: yatisKayitlari.length || (doktor ? 0 : "…"),
      icon: BedDouble,
      to: "/doktor/servisim",
    },
  ];

  const altPanel = (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        className="rounded-lg corporate-panel"
        style={{ background: "var(--panel-inset-bg)" }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 brand-header-panel">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-widest">
              Bugünkü randevularım
            </h3>
          </div>
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
            <Link to="/doktor/randevularim">Tümü</Link>
          </Button>
        </div>
        {bugunRandevular.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            Bugün için randevu yok.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {bugunRandevular.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{randevuHastaAdi(r)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatIstanbulDateTime(r.tarih_saat)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={durumToBadgeVariant(r.durum)}>{r.durum}</Badge>
                  {r.durum === "BEKLEMEDE" && (
                    <Button asChild size="sm" variant="outline" className="h-7">
                      <Link to={`/doktor/muayene?randevu=${r.id}`}>Muayene</Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="rounded-lg corporate-panel"
        style={{ background: "var(--panel-inset-bg)" }}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3 brand-header-panel">
          <ClipboardList className="h-4 w-4" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-widest">
            Bekleyen işler
          </h3>
        </div>
        <ul className="divide-y divide-border text-sm">
          <li className="flex items-center justify-between px-4 py-2.5">
            <span>Epikriz onayı (taslak)</span>
            <span className="font-semibold tabular-nums">{bekleyenEpikriz}</span>
          </li>
          <li className="flex items-center justify-between px-4 py-2.5">
            <span>Konsültasyon isteği (bana)</span>
            <span className="font-semibold tabular-nums">{bekleyenKons}</span>
          </li>
          <li className="flex items-center justify-between px-4 py-2.5">
            <span>Klinik onay bekleyen</span>
            <span className="font-semibold tabular-nums">
              {ozet?.bekleyen_onay ?? "…"}
            </span>
          </li>
          <li className="flex items-center justify-between px-4 py-2.5">
            <span>Bekleyen muayene</span>
            <span className="font-semibold tabular-nums">
              {ozet?.bekleyen_muayene ?? "…"}
            </span>
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 border-t px-4 py-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/doktor/epikriz">
              <HeartPulse className="mr-1 h-3 w-3" />
              Epikriz
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/doktor/konsultasyonlar">Konsültasyonlar</Link>
          </Button>
        </div>
      </section>
    </div>
  );

  return <RoleDashboard metrics={metrics} altPanel={altPanel} />;
}
