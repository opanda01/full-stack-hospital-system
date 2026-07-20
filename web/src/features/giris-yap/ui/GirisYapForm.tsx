import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui";
import { homeForRole, useAuthStore } from "@/shared/auth";
import { loginRequest } from "../api/login";
import { girisSchema, type GirisFormValues } from "../model/schema";

export function GirisYapForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GirisFormValues>({
    resolver: zodResolver(girisSchema),
    defaultValues: { email: "admin@hastane.example.com", sifre: "Test1234!" },
  });

  const onSubmit = async (data: GirisFormValues) => {
    setHata(null);
    try {
      const res = await loginRequest(data.email, data.sifre);
      setAuth(res.access_token, [res.rol], [], res.refresh_token ?? null);
      navigate(homeForRole(res.rol), { replace: true });
    } catch {
      setHata("E-posta veya şifre hatalı");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-white p-6 shadow-sm"
    >
      <p className="text-xs text-muted-foreground">
        Demo: <strong>admin@hastane.example.com</strong> / <strong>Test1234!</strong>
      </p>
      <label className="flex flex-col gap-1 text-sm">
        E-posta
        <input
          className="rounded-md border border-border px-3 py-2"
          type="email"
          autoComplete="username"
          {...register("email")}
        />
        {errors.email && (
          <span className="text-xs text-red-600">{errors.email.message}</span>
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
