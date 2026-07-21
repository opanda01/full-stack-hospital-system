import type { ReactNode } from "react";
import { Activity } from "lucide-react";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const HOSPITAL_NAME = "Çanakkale Mehmet Akif Ersoy Devlet Hastanesi";
const PRODUCT_NAME = "Hastane Bilgi Yönetim Sistemi";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative flex flex-col justify-between overflow-hidden px-8 py-10 text-white lg:px-12 lg:py-14"
        style={{
          background:
            "linear-gradient(160deg, var(--nav-active-bg) 0%, #0a4f3d 55%, #083d30 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15), transparent 40%)",
          }}
          aria-hidden
        />

        <div className="relative z-10">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Activity className="h-6 w-6" stroke="currentColor" />
          </div>
          <p className="text-sm font-medium text-white/80">{PRODUCT_NAME}</p>
          <h1 className="mt-3 max-w-md text-2xl font-semibold leading-snug tracking-tight lg:text-3xl">
            {HOSPITAL_NAME}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Personel paneline güvenli erişim. Sicil numarası, kullanıcı adı veya
            e-posta ile giriş yapın.
          </p>
        </div>

        <p className="relative z-10 hidden text-xs text-white/55 lg:block">
          Yetkisiz erişim yasaktır. Oturumlarınız denetlenir.
        </p>
      </aside>

      <main className="flex flex-col justify-center bg-[var(--panel-bg)] px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          {children}

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
