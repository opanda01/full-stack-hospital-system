import { Link } from "react-router-dom";
import { homeForRole, useAuthStore } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import { useInPanelShell } from "@/shared/ui/panel-shell-context";

/**
 * Eski üst menülü sayfa çerçevesi.
 * PanelShell (RoleLayoutRoute) içindeyse yalnızca children render eder.
 */
export function LegacyShell({
  title,
  children,
  links = [],
}: {
  title: string;
  children?: React.ReactNode;
  links?: { to: string; label: string }[];
}) {
  const inPanel = useInPanelShell();
  const { roles, logout, primaryRole } = useAuthStore();
  const rol = primaryRole();

  if (inPanel) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Rol: {roles.join(", ") || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={homeForRole(rol)}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            Ana sayfa
          </Link>
          <Button
            type="button"
            onClick={() => {
              void logout().finally(() => {
                window.location.href = "/giris";
              });
            }}
          >
            Çıkış
          </Button>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </main>
  );
}
