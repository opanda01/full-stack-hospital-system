import { Link } from "react-router-dom";
import { homeForRole, useAuthStore } from "@/shared/auth";
import { Button } from "@/shared/ui";

export function ForbiddenPage() {
  const primaryRole = useAuthStore((s) => s.primaryRole);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-foreground">403 — Yetkisiz</h1>
      <p className="text-sm text-muted-foreground">Bu sayfaya erişim yetkiniz yok.</p>
      <div className="flex gap-2">
        <Link
          to={homeForRole(primaryRole())}
          className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white"
        >
          Ana sayfaya dön
        </Link>
        <Button
          type="button"
          onClick={() => {
            useAuthStore.getState().clear();
            window.location.href = "/giris";
          }}
        >
          Çıkış
        </Button>
      </div>
    </main>
  );
}
