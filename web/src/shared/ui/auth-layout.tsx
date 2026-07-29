import type { ReactNode } from "react";
import { InstitutionEmblem } from "@/shared/ui/InstitutionEmblem";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  kurumUstIbare?: string;
  hastaneAdi?: string;
};

const HOSPITAL_NAME = "Çanakkale Mehmet Akif Ersoy Devlet Hastanesi";
const PRODUCT_NAME = "Hastane Bilgi Yönetim Sistemi";
const DEFAULT_KURUM = "T.C. Sağlık Bakanlığı";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  kurumUstIbare = DEFAULT_KURUM,
  hastaneAdi = HOSPITAL_NAME,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative flex flex-col justify-between overflow-hidden px-8 py-10 text-white lg:px-12 lg:py-14"
        style={{
          background:
            "linear-gradient(165deg, color-mix(in srgb, var(--nav-active-bg) 65%, #000) 0%, var(--nav-active-bg) 48%, #083d30 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.4), transparent 50%)",
          }}
          aria-hidden
        />

        <div className="relative z-10">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/25">
              <InstitutionEmblem className="h-9 w-9 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                {kurumUstIbare}
              </p>
              <p className="mt-1 text-sm font-medium text-white/90">{PRODUCT_NAME}</p>
            </div>
          </div>
          <h1 className="max-w-md text-2xl font-semibold leading-snug tracking-tight lg:text-3xl">
            {hastaneAdi}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Personel paneline güvenli erişim. Sicil numarası, kullanıcı adı veya
            e-posta ile giriş yapın.
          </p>
        </div>

        <p className="relative z-10 hidden text-xs text-white/55 lg:block">
          Yetkisiz erişim yasaktır. Oturumlarınız denetlenir. Kişisel veriler KVKK
          kapsamında işlenir.
        </p>
      </aside>

      <main className="flex flex-col justify-center bg-[var(--panel-bg)] px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg border corporate-panel">
          <div className="brand-header-panel flex items-center gap-3 border-b px-6 py-3"
            style={{
              borderColor: "color-mix(in srgb, #000 20%, transparent)",
            }}
          >
            <InstitutionEmblem className="h-6 w-6 shrink-0 opacity-90" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              Resmi Personel Girişi
            </span>
          </div>
          <div className="px-6 py-8">
            <div className="mb-8">
              <p className="page-eyebrow">Oturum</p>
              <h2 className="page-title mt-1">{title}</h2>
              {subtitle ? (
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            {children}

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  );
}
