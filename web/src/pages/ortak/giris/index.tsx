import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GirisYapForm } from "@/features/giris-yap";
import {
  MOCK_USERS,
  postLoginPath,
  USE_MOCK_AUTH,
  useAuthStore,
} from "@/shared/auth";
import { AuthLayout, Button } from "@/shared/ui";

export function GirisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [hizliHata, setHizliHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const sifreSifirlandi = Boolean(
    (location.state as { sifreSifirlandi?: boolean } | null)?.sifreSifirlandi,
  );

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
    <AuthLayout
      title="Personel girişi"
      subtitle="Hesabınıza sicil numarası, kullanıcı adı veya e-posta ile giriş yapın."
      footer={
        USE_MOCK_AUTH ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
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
              <div
                role="alert"
                className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {hizliHata}
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      {sifreSifirlandi && (
        <div
          role="status"
          className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
        </div>
      )}
      <GirisYapForm />
    </AuthLayout>
  );
}
