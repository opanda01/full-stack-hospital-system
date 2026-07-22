import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared/ui";
import { postLoginPath, useAuthStore, USE_MOCK_AUTH } from "@/shared/auth";
import {
  DEV_BASHEKIM_CREDENTIALS,
  DEV_CREDENTIALS,
  DEV_DOKTOR_CREDENTIALS,
  DEV_HEMSIRE_CREDENTIALS,
  girisSchema,
  type GirisFormValues,
} from "../model/schema";

/** LoginForm — sicil / kullanıcı adı / e-posta + şifre */
export function GirisYapForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [hata, setHata] = useState<string | null>(null);
  const [sifreGorunur, setSifreGorunur] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GirisFormValues>({
    resolver: zodResolver(girisSchema),
    defaultValues: {
      kimlik: DEV_CREDENTIALS.kimlik,
      sifre: DEV_CREDENTIALS.sifre,
    },
  });

  const fillTest = (kimlik: string, sifre: string) => {
    setValue("kimlik", kimlik, { shouldValidate: true });
    setValue("sifre", sifre, { shouldValidate: true });
    setHata(null);
  };

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {import.meta.env.DEV && (
        <details className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none font-medium">
            Test girişi{USE_MOCK_AUTH ? " (mock)" : ""}
          </summary>
          <ul className="mt-2 space-y-1.5">
            <li>
              <button
                type="button"
                className="text-left underline-offset-2 hover:text-foreground hover:underline"
                onClick={() =>
                  fillTest(DEV_CREDENTIALS.kimlik, DEV_CREDENTIALS.sifre)
                }
              >
                Admin: <strong>{DEV_CREDENTIALS.kimlik}</strong> /{" "}
                <strong>{DEV_CREDENTIALS.sifre}</strong>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="text-left underline-offset-2 hover:text-foreground hover:underline"
                onClick={() =>
                  fillTest(
                    DEV_BASHEKIM_CREDENTIALS.kimlik,
                    DEV_BASHEKIM_CREDENTIALS.sifre,
                  )
                }
              >
                Başhekim: <strong>{DEV_BASHEKIM_CREDENTIALS.kimlik}</strong> /{" "}
                <strong>{DEV_BASHEKIM_CREDENTIALS.sifre}</strong>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="text-left underline-offset-2 hover:text-foreground hover:underline"
                onClick={() =>
                  fillTest(
                    DEV_DOKTOR_CREDENTIALS.kimlik,
                    DEV_DOKTOR_CREDENTIALS.sifre,
                  )
                }
              >
                Doktor: <strong>{DEV_DOKTOR_CREDENTIALS.kimlik}</strong> /{" "}
                <strong>{DEV_DOKTOR_CREDENTIALS.sifre}</strong>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="text-left underline-offset-2 hover:text-foreground hover:underline"
                onClick={() =>
                  fillTest(
                    DEV_HEMSIRE_CREDENTIALS.kimlik,
                    DEV_HEMSIRE_CREDENTIALS.sifre,
                  )
                }
              >
                Hemşire: <strong>{DEV_HEMSIRE_CREDENTIALS.kimlik}</strong> /{" "}
                <strong>{DEV_HEMSIRE_CREDENTIALS.sifre}</strong>
              </button>
            </li>
          </ul>
        </details>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Sicil no / kullanıcı adı / e-posta
        <Input
          type="text"
          autoComplete="username"
          placeholder="ADM-001 veya e-posta"
          {...register("kimlik")}
        />
        {errors.kimlik && (
          <span className="text-xs font-normal text-destructive">
            {errors.kimlik.message}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Şifre
        <div className="relative">
          <Input
            type={sifreGorunur ? "text" : "password"}
            autoComplete="current-password"
            className="pr-10"
            {...register("sifre")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            onClick={() => setSifreGorunur((v) => !v)}
            aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {sifreGorunur ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.sifre && (
          <span className="text-xs font-normal text-destructive">
            {errors.sifre.message}
          </span>
        )}
      </label>

      {hata && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {hata}
        </div>
      )}

      <div className="flex justify-end">
        <Link
          to="/sifre-sifirla"
          className="text-xs text-primary underline-offset-4 hover:underline"
        >
          Şifremi unuttum
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Hesabınıza ulaşamıyorsanız bilgi işlem ile iletişime geçin.
      </p>
    </form>
  );
}

export { GirisYapForm as LoginForm };
