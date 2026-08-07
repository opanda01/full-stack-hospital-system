import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, postLoginPath, useAuthStore } from "@/shared/auth";
import {
  DEMO_HASTA_ETIKET,
  DEMO_HASTA_TC,
  DEMO_HASTA_TELEFON,
  gecerliTcKimlikNo,
  getApiErrorMessage,
  TC_GECERSIZ_MESAJ,
} from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type Step = "bilgi" | "otp";

export function HastaGirisForm() {
  const navigate = useNavigate();
  const loginWithOtp = useAuthStore((s) => s.loginWithOtp);
  const [step, setStep] = useState<Step>("bilgi");
  const [telefon, setTelefon] = useState(
    import.meta.env.DEV ? DEMO_HASTA_TELEFON : "",
  );
  const [tc, setTc] = useState(import.meta.env.DEV ? DEMO_HASTA_TC : "");
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const gonder = async () => {
    setHata(null);
    if (!telefon.trim() || !gecerliTcKimlikNo(tc)) {
      setHata(
        tc.trim() && !gecerliTcKimlikNo(tc)
          ? TC_GECERSIZ_MESAJ
          : "Telefon ve TC zorunludur",
      );
      return;
    }
    setLoading(true);
    try {
      const sonuc = await authApi.otpGonder({
        telefon: telefon.trim(),
        tc_kimlik_no: tc.trim(),
        amac: "GIRIS",
      });
      if (sonuc.gelistirme_kodu) {
        setKod(sonuc.gelistirme_kodu);
      }
      setStep("otp");
    } catch (err) {
      setHata(getApiErrorMessage(err, "OTP gönderilemedi"));
    } finally {
      setLoading(false);
    }
  };

  const dogrula = async () => {
    setHata(null);
    setLoading(true);
    try {
      const me = await loginWithOtp({
        telefon: telefon.trim(),
        tc_kimlik_no: tc.trim(),
        kod: kod.trim(),
      });
      navigate(postLoginPath(me), { replace: true });
    } catch (err) {
      setHata(getApiErrorMessage(err, "Doğrulama başarısız"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {import.meta.env.DEV ? (
        <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
          <p className="font-semibold text-foreground">Test hasta (seed)</p>
          <p className="text-foreground">
            {DEMO_HASTA_ETIKET} — TC <strong>{DEMO_HASTA_TC}</strong>
          </p>
          <p className="text-foreground">
            Telefon <strong>{DEMO_HASTA_TELEFON}</strong>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Alanlar otomatik doldurulur. OTP kodu backend konsol / SMS stub çıktısında
            veya geliştirme yanıtında görünür.
          </p>
        </div>
      ) : null}

      {step === "bilgi" ? (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Telefon
            <Input
              type="tel"
              autoComplete="tel"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            TC Kimlik No
            <Input
              inputMode="numeric"
              maxLength={11}
              value={tc}
              onChange={(e) => setTc(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          {hata ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {hata}
            </div>
          ) : null}
          <Button type="button" className="w-full" disabled={loading} onClick={() => void gonder()}>
            {loading ? "…" : "Doğrulama kodu gönder"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {telefon} numarasına gönderilen 6 haneli kodu girin.
            {kod
              ? " (Dev: kod otomatik dolduruldu.)"
              : " (Dev: SMS stub / konsol çıktısına bakın.)"}
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            OTP kodu
            <Input
              inputMode="numeric"
              maxLength={6}
              value={kod}
              onChange={(e) => setKod(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          {hata ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {hata}
            </div>
          ) : null}
          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={() => void dogrula()}
          >
            {loading ? "…" : "Giriş yap"}
          </Button>
          <button
            type="button"
            className="text-center text-xs text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setStep("bilgi");
              setKod("");
              setHata(null);
            }}
          >
            Bilgileri değiştir
          </button>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Personel misiniz?{" "}
        <Link to="/giris" className="text-primary underline-offset-4 hover:underline">
          Personel girişi
        </Link>
      </p>
    </div>
  );
}
