import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Button } from "@/shared/ui";
import { homeForRole, ProtectedRoute, useAuthStore } from "@/shared/auth";

function KvkkOnayInner() {
  const navigate = useNavigate();
  const kvkkOnay = useAuthStore((s) => s.kvkkOnay);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [onay, setOnay] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async () => {
    setHata(null);
    if (!onay) {
      setHata("Devam etmek için KVKK metnini onaylamanız gerekir.");
      return;
    }
    setYukleniyor(true);
    try {
      const me = await kvkkOnay();
      navigate(homeForRole(me.rol), { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setHata(typeof detail === "string" ? detail : "Onay kaydedilemedi");
      } else if (err instanceof Error) {
        setHata(err.message);
      } else {
        setHata("Onay kaydedilemedi");
      }
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">KVKK açık rıza onayı</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Merhaba {currentUser?.ad} {currentUser?.soyad}. Sistemi kullanmaya
          devam etmek için kişisel verilerinizin işlenmesine ilişkin aydınlatma
          metnini okuyup onaylamanız gerekmektedir.
        </p>
        <div className="mt-4 max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kimlik,
            iletişim ve iş süreçlerine ilişkin verileriniz hastane bilgi
            yönetim sistemi üzerinden işlenebilir, saklanabilir ve mevzuatta
            öngörülen sürelerle muhafaza edilebilir. Verileriniz yalnızca
            yetkili personel tarafından, hizmet sunumu amacıyla kullanılır.
          </p>
          <p className="mt-2">
            Onay vermeniz halinde iş süreçlerine erişiminiz açılır. Onayı
            reddetmeniz halinde personel paneline giriş sağlayamazsınız.
          </p>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={onay}
            onChange={(e) => setOnay(e.target.checked)}
          />
          <span>
            Aydınlatma metnini okudum; kişisel verilerimin işlenmesini kabul
            ediyorum.
          </span>
        </label>
        {hata && <p className="mt-2 text-xs text-red-600">{hata}</p>}
        <Button
          className="mt-4 w-full"
          type="button"
          disabled={yukleniyor}
          onClick={() => void gonder()}
        >
          {yukleniyor ? "Kaydediliyor…" : "Onayla ve devam et"}
        </Button>
      </div>
    </main>
  );
}

export function KvkkOnayPage() {
  return (
    <ProtectedRoute>
      <KvkkOnayInner />
    </ProtectedRoute>
  );
}
