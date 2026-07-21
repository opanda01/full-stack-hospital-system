import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuthStore } from "@/shared/auth";

/** HASTA rolü web paneline giremez — mobil uygulamaya yönlendirilir. */
export function HastaMobilPage() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Mobil uygulama gerekli</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Bu panel personel içindir, lütfen mobil uygulamayı kullanın.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="outline">
            <Link to="/giris">Giriş sayfasına dön</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void logout().finally(() => {
                window.location.href = "/giris";
              });
            }}
          >
            Çıkış yap
          </Button>
        </div>
      </div>
    </div>
  );
}
