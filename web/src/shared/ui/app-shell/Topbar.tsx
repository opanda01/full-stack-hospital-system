import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronRight, KeyRound, LogOut, Settings, User } from "lucide-react";
import type { CurrentUser } from "@/shared/auth";
import { useAuthStore } from "@/shared/auth";
import type { NavItem, Rol } from "@/shared/config/nav-items";
import { ROL_ETIKET } from "@/shared/config/nav-items";
import { api } from "@/shared/api";
import { LOOKUP_PAGE_SIZE, unwrapPage, type PageResponse } from "@/shared/lib";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type TopbarProps = {
  navItems: NavItem[];
  currentUser: CurrentUser;
};

type Bildirim = {
  id: number;
  baslik: string;
  govde: string;
  tip: string;
  okundu_mu: boolean;
  created_at: string;
};

function initials(ad: string, soyad: string) {
  return `${ad.charAt(0)}${soyad.charAt(0)}`.toUpperCase();
}

function formatKurumsalTarih(d: Date) {
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function vardiyaEtiketi(d: Date) {
  const h = d.getHours();
  if (h >= 7 && h < 19) return "Gündüz Vardiyası";
  return "Gece Vardiyası";
}

export function Topbar({ navItems, currentUser }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const pageTitle = useMemo(() => {
    const match = [...navItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find(
        (item) =>
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`),
      );
    return match?.label ?? "Panel";
  }, [location.pathname, navItems]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const crumbs: { label: string; path: string }[] = [];
    let acc = "";
    for (const seg of segments) {
      acc += `/${seg}`;
      const item = navItems.find((n) => n.path === acc);
      crumbs.push({
        label: item?.label ?? seg.replace(/-/g, " "),
        path: acc,
      });
    }
    return crumbs;
  }, [location.pathname, navItems]);

  const rolEtiket =
    ROL_ETIKET[currentUser.rol as Rol | "HASTA"] ?? currentUser.rol;

  const { data: bildirimler = [] } = useQuery({
    queryKey: ["panel-bildirimler"],
    queryFn: async () => {
      try {
        return unwrapPage(
          (
            await api.get<PageResponse<Bildirim>>("/yatis/bildirimler", {
              params: { page_size: LOOKUP_PAGE_SIZE },
            })
          ).data,
        );
      } catch {
        return [] as Bildirim[];
      }
    },
    refetchInterval: 60_000,
  });

  const okunmamis = bildirimler.filter((b) => !b.okundu_mu).length;

  const okunduMut = useMutation({
    mutationFn: async (id: number) =>
      api.patch(`/yatis/bildirimler/${id}/okundu`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-bildirimler"] }),
  });

  return (
    <header className="flex shrink-0 flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "color-mix(in srgb, var(--text-secondary) 15%, transparent)" }}
    >
      <div className="min-w-0">
        {breadcrumbs.length > 1 ? (
          <nav
            className="mb-1 flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Konum"
          >
            {breadcrumbs.map((c, i) => (
              <span key={c.path} className="flex items-center gap-1">
                {i > 0 ? (
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                ) : null}
                {i < breadcrumbs.length - 1 ? (
                  <Link
                    to={c.path}
                    className="hover:text-[color:var(--text-primary)]"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-[color:var(--text-primary)]">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <p className="page-eyebrow mb-0.5">Bilgi Yönetim Sistemi</p>
        )}
        <h1 className="page-title truncate">{pageTitle}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div
          className="hidden text-right text-[11px] leading-tight lg:block"
          style={{ color: "var(--text-secondary)" }}
        >
          <p className="font-medium text-[color:var(--text-primary)]">
            {formatKurumsalTarih(now)}
          </p>
          <p>{vardiyaEtiketi(now)}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Bildirimler"
              className="relative text-[color:var(--text-secondary)] hover:bg-[color:var(--panel-inset-bg)]"
            >
              <Bell className="h-4 w-4" />
              {okunmamis > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {okunmamis > 9 ? "9+" : okunmamis}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {bildirimler.slice(0, 8).map((b) => (
              <DropdownMenuItem
                key={b.id}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
                onClick={() => {
                  if (!b.okundu_mu) okunduMut.mutate(b.id);
                }}
              >
                <span className={`text-sm ${b.okundu_mu ? "text-muted-foreground" : "font-medium"}`}>
                  {b.baslik}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {b.govde}
                </span>
              </DropdownMenuItem>
            ))}
            {!bildirimler.length && (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                Bildirim yok
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[color:var(--panel-inset-bg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-xs"
                  style={{
                    background: "var(--nav-active-bg)",
                    color: "var(--nav-active-text)",
                  }}
                >
                  {initials(currentUser.ad, currentUser.soyad)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight sm:block">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {currentUser.ad} {currentUser.soyad}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {rolEtiket}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profil">
                <User />
                Profilim
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/ayarlar">
                <Settings />
                Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/sifre-degistir">
                <KeyRound />
                Şifre değiştir
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout().finally(() => {
                  navigate("/giris", { replace: true });
                });
              }}
            >
              <LogOut />
              Çıkış yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
