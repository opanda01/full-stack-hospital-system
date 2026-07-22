import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, KeyRound, LogOut, Settings, User } from "lucide-react";
import type { CurrentUser } from "@/shared/auth";
import { useAuthStore } from "@/shared/auth";
import type { NavItem, Rol } from "@/shared/config/nav-items";
import { ROL_ETIKET } from "@/shared/config/nav-items";
import { api } from "@/shared/api";
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

export function Topbar({ navItems, currentUser }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();

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

  const rolEtiket =
    ROL_ETIKET[currentUser.rol as Rol | "HASTA"] ?? currentUser.rol;

  const { data: bildirimler = [] } = useQuery({
    queryKey: ["panel-bildirimler"],
    queryFn: async () => {
      try {
        return (await api.get<Bildirim[]>("/yatis/bildirimler")).data;
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
    <header className="flex h-12 shrink-0 items-center justify-between">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {pageTitle}
      </h1>

      <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-[color:var(--panel-inset-bg)] focus-visible:outline-none"
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
