import { Link } from "react-router-dom";
import { homeForRole, useAuthStore } from "@/shared/auth";
import { Button } from "@/shared/ui";

export function AppShell({
  title,
  children,
  links = [],
}: {
  title: string;
  children?: React.ReactNode;
  links?: { to: string; label: string }[];
}) {
  const { roles, logout, primaryRole } = useAuthStore();
  const rol = primaryRole();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">Rol: {roles.join(", ") || "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-sm text-sky-800 hover:bg-sky-50"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={homeForRole(rol)}
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
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
