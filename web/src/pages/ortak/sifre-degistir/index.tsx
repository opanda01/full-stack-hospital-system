import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Input } from "@/shared/ui";
import { onboardingPath, ProtectedRoute, useAuthStore } from "@/shared/auth";

const schema = z
  .object({
    eski_sifre: z.string().min(1, "Eski şifre gerekli"),
    yeni_sifre: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
    yeni_sifre_tekrar: z.string().min(8, "Şifre tekrarı gerekli"),
  })
  .refine((d) => d.yeni_sifre === d.yeni_sifre_tekrar, {
    message: "Şifreler eşleşmiyor",
    path: ["yeni_sifre_tekrar"],
  });

type FormValues = z.infer<typeof schema>;

function SifreDegistirInner() {
  const navigate = useNavigate();
  const sifreDegistir = useAuthStore((s) => s.sifreDegistir);
  const currentUser = useAuthStore((s) => s.currentUser);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setHata(null);
    try {
      await sifreDegistir(data.eski_sifre, data.yeni_sifre);
      const me = await fetchMe();
      navigate(onboardingPath(me), { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setHata(typeof detail === "string" ? detail : "Şifre değiştirilemedi");
      } else if (err instanceof Error) {
        setHata(err.message);
      } else {
        setHata("Şifre değiştirilemedi");
      }
    }
  };

  return (
    <AuthLayout
      title="Şifre değiştir"
      subtitle={
        currentUser?.sifre_degistirmeli_mi
          ? "İlk girişte geçici şifrenizi değiştirmeniz zorunludur."
          : "Hesap şifrenizi güncelleyin."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Mevcut şifre
          <Input
            type="password"
            autoComplete="current-password"
            {...register("eski_sifre")}
          />
          {errors.eski_sifre && (
            <span className="text-xs font-normal text-destructive">
              {errors.eski_sifre.message}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Yeni şifre
          <Input
            type="password"
            autoComplete="new-password"
            {...register("yeni_sifre")}
          />
          {errors.yeni_sifre && (
            <span className="text-xs font-normal text-destructive">
              {errors.yeni_sifre.message}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Yeni şifre (tekrar)
          <Input
            type="password"
            autoComplete="new-password"
            {...register("yeni_sifre_tekrar")}
          />
          {errors.yeni_sifre_tekrar && (
            <span className="text-xs font-normal text-destructive">
              {errors.yeni_sifre_tekrar.message}
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor…" : "Şifreyi güncelle"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function SifreDegistirPage() {
  return (
    <ProtectedRoute>
      <SifreDegistirInner />
    </ProtectedRoute>
  );
}
