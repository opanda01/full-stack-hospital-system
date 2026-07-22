import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { AuthLayout, Button } from "@/shared/ui";
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
    <AuthLayout
      title="KVKK açık rıza onayı"
      subtitle={`Merhaba ${currentUser?.ad ?? ""} ${currentUser?.soyad ?? ""}. Sistemi kullanmaya devam etmek için kişisel verilerinizin işlenmesine ilişkin aydınlatma metnini okuyup onaylamanız gerekmektedir.`}
    >
      <div className="flex flex-col gap-4">
        <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
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
        <label className="flex items-start gap-2 text-sm">
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
        {hata && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {hata}
          </div>
        )}
        <Button
          className="w-full"
          type="button"
          disabled={yukleniyor}
          onClick={() => void gonder()}
        >
          {yukleniyor ? "Kaydediliyor…" : "Onayla ve devam et"}
        </Button>
      </div>
    </AuthLayout>
  );
}

export function KvkkOnayPage() {
  return (
    <ProtectedRoute>
      <KvkkOnayInner />
    </ProtectedRoute>
  );
}
