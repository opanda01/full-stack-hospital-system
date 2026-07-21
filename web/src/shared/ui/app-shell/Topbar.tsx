import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, KeyRound, LogOut, Settings, User } from "lucide-react";
import type { CurrentUser } from "@/shared/auth";
import { useAuthStore } from "@/shared/auth";
import type { NavItem, Rol } from "@/shared/config/nav-items";
import { ROL_ETIKET } from "@/shared/config/nav-items";
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

function initials(ad: string, soyad: string) {
  return `${ad.charAt(0)}${soyad.charAt(0)}`.toUpperCase();
}

export function Topbar({ navItems, currentUser }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

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

  return (
    <header className="flex h-12 shrink-0 items-center justify-between">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {pageTitle}
      </h1>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Bildirimler"
          className="text-[color:var(--text-secondary)] hover:bg-[color:var(--panel-inset-bg)]"
        >
          <Bell className="h-4 w-4" />
        </Button>

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
