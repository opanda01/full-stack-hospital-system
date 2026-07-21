import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GirisYapForm } from "@/features/giris-yap";
import {
  MOCK_USERS,
  postLoginPath,
  USE_MOCK_AUTH,
  useAuthStore,
} from "@/shared/auth";
import { Button } from "@/shared/ui/button";

export function GirisPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [hizliHata, setHizliHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const hizliGirisYap = async (kimlik: string, sifre: string) => {
    setHizliHata(null);
    setYukleniyor(true);
    try {
      const me = await login(kimlik, sifre);
      navigate(postLoginPath(me), { replace: true });
    } catch (err) {
      setHizliHata(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-primary">
          Çanakkale Mehmet Akif Ersoy Devlet Hastanesi
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hastane Bilgi Yönetim Sistemi — Personel girişi
        </p>
      </div>

      <div className="w-full max-w-sm">
        <GirisYapForm />

        {USE_MOCK_AUTH && (
          <div className="mt-6 rounded-lg border border-border bg-card p-4 pt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Hızlı giriş (demo — sicil ile)
            </p>
            <div className="flex flex-wrap gap-2">
              {MOCK_USERS.filter((u) => u.rol !== "HASTA").map((u) => (
                <Button
                  key={u.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={yukleniyor}
                  onClick={() =>
                    void hizliGirisYap(u.sicil_no ?? u.email, u.sifre)
                  }
                >
                  {u.rol}
                </Button>
              ))}
            </div>
            {hizliHata && (
              <p className="mt-2 text-xs text-red-600">{hizliHata}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
