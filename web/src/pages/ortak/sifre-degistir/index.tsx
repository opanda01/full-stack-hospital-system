import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui";
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Şifre değiştir</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {currentUser?.sifre_degistirmeli_mi
            ? "İlk girişte geçici şifrenizi değiştirmeniz zorunludur."
            : "Hesap şifrenizi güncelleyin."}
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <label className="flex flex-col gap-1 text-sm">
            Mevcut şifre
            <input
              type="password"
              className="rounded-md border border-border px-3 py-2"
              autoComplete="current-password"
              {...register("eski_sifre")}
            />
            {errors.eski_sifre && (
              <span className="text-xs text-red-600">
                {errors.eski_sifre.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Yeni şifre
            <input
              type="password"
              className="rounded-md border border-border px-3 py-2"
              autoComplete="new-password"
              {...register("yeni_sifre")}
            />
            {errors.yeni_sifre && (
              <span className="text-xs text-red-600">
                {errors.yeni_sifre.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Yeni şifre (tekrar)
            <input
              type="password"
              className="rounded-md border border-border px-3 py-2"
              autoComplete="new-password"
              {...register("yeni_sifre_tekrar")}
            />
            {errors.yeni_sifre_tekrar && (
              <span className="text-xs text-red-600">
                {errors.yeni_sifre_tekrar.message}
              </span>
            )}
          </label>
          {hata && <p className="text-xs text-red-600">{hata}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export function SifreDegistirPage() {
  return (
    <ProtectedRoute>
      <SifreDegistirInner />
    </ProtectedRoute>
  );
}
