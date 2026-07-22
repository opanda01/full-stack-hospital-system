import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/shared/auth";
import { Button, Input } from "@/shared/ui";
import {
  istekSchema,
  onaySchema,
  type IstekFormValues,
  type OnayFormValues,
} from "../model/schema";

function hataMesaji(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (!err.response) {
      return "API'ye ulaşılamadı. Backend'in :8000 portunda çalıştığından emin olun.";
    }
    if (typeof detail === "string") return detail;
  } else if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function SifreSifirlaForm() {
  const navigate = useNavigate();
  const [adim, setAdim] = useState<1 | 2>(1);
  const [kimlik, setKimlik] = useState("");
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const istekForm = useForm<IstekFormValues>({
    resolver: zodResolver(istekSchema),
    defaultValues: { kimlik: "" },
  });

  const onayForm = useForm<OnayFormValues>({
    resolver: zodResolver(onaySchema),
    defaultValues: { kod: "", yeni_sifre: "", yeni_sifre_tekrar: "" },
  });

  const onIstek = async (data: IstekFormValues) => {
    setHata(null);
    setBilgi(null);
    try {
      const res = await authApi.sifreSifirlaIstek(data.kimlik.trim());
      setKimlik(data.kimlik.trim());
      setBilgi(res.mesaj);
      setAdim(2);
    } catch (err) {
      setHata(hataMesaji(err, "Kod gönderilemedi"));
    }
  };

  const onOnay = async (data: OnayFormValues) => {
    setHata(null);
    try {
      await authApi.sifreSifirlaOnay(kimlik, data.kod, data.yeni_sifre);
      navigate("/giris", {
        replace: true,
        state: { sifreSifirlandi: true },
      });
    } catch (err) {
      setHata(hataMesaji(err, "Şifre sıfırlanamadı"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {bilgi && (
        <div
          role="status"
          className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          {bilgi}
        </div>
      )}

      {hata && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {hata}
        </div>
      )}

      {adim === 1 ? (
        <form
          onSubmit={istekForm.handleSubmit(onIstek)}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Sicil no / kullanıcı adı / e-posta
            <Input
              type="text"
              autoComplete="username"
              placeholder="ADM-001 veya e-posta"
              {...istekForm.register("kimlik")}
            />
            {istekForm.formState.errors.kimlik && (
              <span className="text-xs font-normal text-destructive">
                {istekForm.formState.errors.kimlik.message}
              </span>
            )}
          </label>
          <Button
            type="submit"
            className="w-full"
            disabled={istekForm.formState.isSubmitting}
          >
            {istekForm.formState.isSubmitting
              ? "Gönderiliyor…"
              : "Kod gönder"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={onayForm.handleSubmit(onOnay)}
          className="flex flex-col gap-4"
        >
          <p className="text-xs text-muted-foreground">
            Kimlik: <strong>{kimlik}</strong>
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Doğrulama kodu
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6 haneli kod"
              {...onayForm.register("kod")}
            />
            {onayForm.formState.errors.kod && (
              <span className="text-xs font-normal text-destructive">
                {onayForm.formState.errors.kod.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Yeni şifre
            <Input
              type="password"
              autoComplete="new-password"
              {...onayForm.register("yeni_sifre")}
            />
            {onayForm.formState.errors.yeni_sifre && (
              <span className="text-xs font-normal text-destructive">
                {onayForm.formState.errors.yeni_sifre.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Yeni şifre (tekrar)
            <Input
              type="password"
              autoComplete="new-password"
              {...onayForm.register("yeni_sifre_tekrar")}
            />
            {onayForm.formState.errors.yeni_sifre_tekrar && (
              <span className="text-xs font-normal text-destructive">
                {onayForm.formState.errors.yeni_sifre_tekrar.message}
              </span>
            )}
          </label>
          <Button
            type="submit"
            className="w-full"
            disabled={onayForm.formState.isSubmitting}
          >
            {onayForm.formState.isSubmitting
              ? "Kaydediliyor…"
              : "Şifreyi güncelle"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setAdim(1);
              setHata(null);
              setBilgi(null);
            }}
          >
            Kimliği değiştir
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/giris" className="text-primary underline-offset-4 hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </div>
  );
}
