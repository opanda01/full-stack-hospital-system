import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui";
import { postLoginPath, useAuthStore, USE_MOCK_AUTH } from "@/shared/auth";
import { DEV_CREDENTIALS, girisSchema, type GirisFormValues } from "../model/schema";

/** LoginForm — sicil / kullanıcı adı / e-posta + şifre */
export function GirisYapForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GirisFormValues>({
    resolver: zodResolver(girisSchema),
    defaultValues: {
      kimlik: DEV_CREDENTIALS.kimlik,
      sifre: DEV_CREDENTIALS.sifre,
    },
  });

  const onSubmit = async (data: GirisFormValues) => {
    setHata(null);
    try {
      const me = await login(data.kimlik.trim(), data.sifre);
      navigate(postLoginPath(me), { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (!err.response) {
          setHata(
            "API'ye ulaşılamadı. Backend'in :8000 portunda çalıştığından emin olun.",
          );
        } else {
          setHata(
            typeof detail === "string" ? detail : "Kimlik veya şifre hatalı",
          );
        }
      } else if (err instanceof Error) {
        setHata(err.message || "Kimlik veya şifre hatalı");
      } else {
        setHata("Giriş başarısız");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm"
    >
      <p className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Test girişi — sicil: <strong>ADM-001</strong>, şifre:{" "}
        <strong>Test1234!</strong>
        {USE_MOCK_AUTH ? " (mock)" : ""}
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Sicil no / kullanıcı adı / e-posta
        <input
          className="rounded-md border border-border px-3 py-2"
          type="text"
          autoComplete="username"
          {...register("kimlik")}
        />
        {errors.kimlik && (
          <span className="text-xs text-red-600">{errors.kimlik.message}</span>
        )}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Şifre
        <input
          className="rounded-md border border-border px-3 py-2"
          type="password"
          autoComplete="current-password"
          {...register("sifre")}
        />
        {errors.sifre && (
          <span className="text-xs text-red-600">{errors.sifre.message}</span>
        )}
      </label>
      {hata && <p className="text-xs text-red-600">{hata}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}

export { GirisYapForm as LoginForm };
