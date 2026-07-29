import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate } from "react-router-dom";
import { KeyRound, Stethoscope } from "lucide-react";
import {
  OnboardingGuard,
  ProtectedRoute,
  useAuthStore,
} from "@/shared/auth";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { NAV_GROUPS, ROL_ETIKET, type Rol } from "@/shared/config/nav-items";
import { Button, Input, PanelShell } from "@/shared/ui";

const schema = z.object({
  ad: z.string().min(1, "Ad gerekli").max(100),
  soyad: z.string().min(1, "Soyad gerekli").max(100),
  email: z
    .string()
    .email("Geçerli bir e-posta girin")
    .or(z.literal(""))
    .optional(),
  telefon: z
    .string()
    .max(20)
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, {
      message: "Telefon en az 10 haneli olmalı",
    }),
});

type FormValues = z.infer<typeof schema>;

function ProfilInner() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const rol = useAuthStore((s) => s.primaryRole());
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState(false);
  const navRol = (rol ?? "ADMIN") as Rol;
  const navGroups = NAV_GROUPS[navRol] ?? NAV_GROUPS.ADMIN;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ad: "",
      soyad: "",
      email: "",
      telefon: "",
    },
  });

  useEffect(() => {
    void fetchMe().catch(() => undefined);
  }, [fetchMe]);

  useEffect(() => {
    if (!currentUser) return;
    reset({
      ad: currentUser.ad,
      soyad: currentUser.soyad,
      email: currentUser.email ?? "",
      telefon: currentUser.telefon ?? "",
    });
  }, [currentUser, reset]);

  if (currentUser?.rol === "HASTA") {
    return <Navigate to="/hasta-mobil" replace />;
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Yükleniyor…
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setHata(null);
    setBasari(false);
    try {
      await api.patch("/auth/me", {
        ad: data.ad.trim(),
        soyad: data.soyad.trim(),
        email: data.email?.trim() ? data.email.trim() : null,
        telefon: data.telefon?.trim() ? data.telefon.trim() : null,
      });
      await fetchMe();
      setBasari(true);
    } catch (err) {
      setHata(getApiErrorMessage(err));
    }
  };

  const rolEtiket =
    ROL_ETIKET[currentUser.rol as Rol | "HASTA"] ?? currentUser.rol;

  return (
    <PanelShell navGroups={navGroups} currentUser={currentUser}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Profilim
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Kişisel bilgilerinizi güncelleyin
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-xl border border-border bg-card p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Ad
              <Input autoComplete="given-name" {...register("ad")} />
              {errors.ad && (
                <span className="text-xs font-normal text-destructive">
                  {errors.ad.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Soyad
              <Input autoComplete="family-name" {...register("soyad")} />
              {errors.soyad && (
                <span className="text-xs font-normal text-destructive">
                  {errors.soyad.message}
                </span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            E-posta
            <Input type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <span className="text-xs font-normal text-destructive">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Telefon
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="05XX XXX XX XX"
              {...register("telefon")}
            />
            {errors.telefon && (
              <span className="text-xs font-normal text-destructive">
                {errors.telefon.message}
              </span>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Kullanıcı adı</span>
              <span className="rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                {currentUser.kullanici_adi?.trim() || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Rol</span>
              <span className="rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                {rolEtiket}
              </span>
            </div>
          </div>

          {hata && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {hata}
            </div>
          )}
          {basari && !isDirty && (
            <p className="text-sm text-emerald-700">Profil kaydedildi.</p>
          )}

          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>

        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold">Hesap</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to="/sifre-degistir"
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Şifre değiştir</span>
                <span className="text-muted-foreground">
                  Hesap güvenliği
                </span>
              </span>
            </Link>
            {currentUser.rol === "DOKTOR" && (
              <Link
                to="/doktor/profilim"
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
              >
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium">Klinik profilim</span>
                  <span className="text-muted-foreground">
                    Uzmanlık ve muayene bilgileri
                  </span>
                </span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </PanelShell>
  );
}

export function ProfilPage() {
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        <ProfilInner />
      </OnboardingGuard>
    </ProtectedRoute>
  );
}
