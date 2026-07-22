import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { KeyRound, ScrollText, Server, Megaphone } from "lucide-react";
import { TemaSecici } from "./TemaSecici";
import { api } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";
import { homeForRole } from "@/shared/auth";

type SistemBilgi = {
  bildirim_backend: string;
  cors_origins: string;
  login_rate_limit_per_minute: number;
  audit_retention_days: number;
  otp_ttl_seconds: number;
  access_token_expire_minutes: number;
};

type SistemGozetim = {
  bildirim_backend: string;
  cors_origins: string;
  login_rate_limit_per_minute: number;
  audit_retention_days: number;
  otp_ttl_seconds: number;
  access_token_expire_minutes: number;
  health: string;
};

export function AyarlarPage() {
  const rol = useAuthStore((s) => s.primaryRole());
  const isAdmin = rol === "ADMIN";
  const isBashekim = rol === "BASHEKIM";
  const root = homeForRole(rol);

  const { data: sistem } = useQuery({
    queryKey: ["sistem-bilgi"],
    queryFn: async () => (await api.get<SistemBilgi>("/sistem/bilgi")).data,
    enabled: isAdmin,
  });

  const { data: gozetim } = useQuery({
    queryKey: ["sistem-gozetim"],
    queryFn: async () =>
      (await api.get<SistemGozetim>("/yetki-devri/sistem-gozetim")).data,
    enabled: isBashekim,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Ayarlar
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Görünüm, yönetişim ve sistem tercihleri
        </p>
      </div>
      <TemaSecici />

      {isAdmin && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold">Yönetişim</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to="/admin/denetim"
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <ScrollText className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Denetim kayıtları</span>
                <span className="text-muted-foreground">
                  İşlem logları ve filtreler
                </span>
              </span>
            </Link>
            <Link
              to="/admin/rbac"
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Roller / İzinler</span>
                <span className="text-muted-foreground">
                  Salt okunur izin matrisi
                </span>
              </span>
            </Link>
          </div>
        </section>
      )}

      {isBashekim && root !== "/giris" && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold">Yönetişim ve gözetim</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to={`${root}/denetim`}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <ScrollText className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Denetim kayıtları</span>
                <span className="text-muted-foreground">
                  PHI görüntüleme, onay ve bypass logları
                </span>
              </span>
            </Link>
            <Link
              to={`${root}/yetki-matrisi`}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Yetki matrisi</span>
                <span className="text-muted-foreground">
                  Roller ve izinler (salt okunur)
                </span>
              </span>
            </Link>
            <Link
              to={`${root}/sistem-gozetim`}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <Server className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Sistem gözetim</span>
                <span className="text-muted-foreground">
                  Health, CORS, rate limit özeti
                </span>
              </span>
            </Link>
            <Link
              to={`${root}/yetki-duyurulari`}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-muted"
            >
              <Megaphone className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-medium">Yetki duyuruları</span>
                <span className="text-muted-foreground">
                  Yetki devri kayıtları
                </span>
              </span>
            </Link>
          </div>
        </section>
      )}

      {isAdmin && sistem && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold">Sistem (salt okunur)</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Bildirim backend</dt>
              <dd className="font-medium">{sistem.bildirim_backend}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">CORS</dt>
              <dd className="break-all font-medium">{sistem.cors_origins}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Login rate limit / dk</dt>
              <dd className="font-medium">
                {sistem.login_rate_limit_per_minute}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Denetim saklama (gün)</dt>
              <dd className="font-medium">{sistem.audit_retention_days}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">OTP TTL (sn)</dt>
              <dd className="font-medium">{sistem.otp_ttl_seconds}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Access token (dk)</dt>
              <dd className="font-medium">
                {sistem.access_token_expire_minutes}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {isBashekim && gozetim && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-semibold">Sistem özeti</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Health</dt>
              <dd className="font-medium">{gozetim.health}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bildirim</dt>
              <dd className="font-medium">{gozetim.bildirim_backend}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Login rate limit / dk</dt>
              <dd className="font-medium">
                {gozetim.login_rate_limit_per_minute}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Denetim saklama (gün)</dt>
              <dd className="font-medium">{gozetim.audit_retention_days}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}

/** Admin route uyumluluğu */
export { AyarlarPage as AdminAyarlarPage };
