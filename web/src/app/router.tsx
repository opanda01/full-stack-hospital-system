import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, RoleGuard, RoleLayoutRoute, OnboardingGuard } from "@/shared/auth";

import { GirisPage } from "@/pages/ortak/giris";
import { ForbiddenPage } from "@/pages/ortak/forbidden";
import { HastaMobilPage } from "@/pages/ortak/hasta-mobil";
import { PlaceholderPage } from "@/pages/ortak/placeholder";
import { ProfilPage } from "@/pages/ortak/profil";
import { AyarlarPage } from "@/pages/ortak/ayarlar";
import { NobetYonetimiPage } from "@/pages/ortak/nobet";
import { SikayetOneriPage } from "@/pages/ortak/sikayet";
import { HastaKayitPage } from "@/pages/ortak/hasta-kayit";
import { TemizlikAtaPage } from "@/pages/ortak/temizlik-ata";
import { SifreDegistirPage } from "@/pages/ortak/sifre-degistir";
import { SifreSifirlaPage } from "@/pages/ortak/sifre-sifirla";
import { KvkkOnayPage } from "@/pages/ortak/kvkk-onay";

import { AdminDashboardPage } from "@/pages/admin/dashboard";
import { KullaniciYonetimiPage } from "@/pages/admin/kullanicilar";
import { PersonelYonetimiPage } from "@/pages/admin/personel";
import { DepartmanYonetimiPage } from "@/pages/admin/departmanlar";
import { DepartmanDetayPage } from "@/pages/admin/departmanlar/detay";
import { AdminDoktorlarPage } from "@/pages/admin/doktorlar";
import { AdminRandevularPage } from "@/pages/admin/randevular";
import { AdminRaporlarPage } from "@/pages/admin/raporlar";
import { AdminAyarlarPage } from "@/pages/admin/ayarlar";
import { homeForRole, useAuthStore } from "@/shared/auth";

import { DoktorDashboardPage } from "@/pages/doktor/dashboard";
import { DoktorRandevularimPage } from "@/pages/doktor/randevularim";
import { DoktorMuayeneEkraniPage } from "@/pages/doktor/muayene";
import { DoktorHastalarimPage } from "@/pages/doktor/hastalarim";
import { DoktorTetkikIstePage } from "@/pages/doktor/tetkik-iste";
import { DoktorProfilPage } from "@/pages/doktor/profilim";

import { HemsireDashboardPage } from "@/pages/hemsire/dashboard";
import { HemsireDepartmanRandevulariPage } from "@/pages/hemsire/departman-randevulari";
import { HemsirePanelPage } from "@/pages/hemsire/panel";

import { LaborantDashboardPage } from "@/pages/laborant/dashboard";
import { LaborantBekleyenPage } from "@/pages/laborant/bekleyen";
import { LaborantPage } from "@/pages/laborant/tetkik-sonuc-girisi";

import { TemizlikDashboardPage } from "@/pages/temizlik/dashboard";
import { TemizlikGorevlerimPage } from "@/pages/temizlik/gorevlerim";

import { BashekimDashboardPage } from "@/pages/bashekim/dashboard";
import { MudurDashboardPage } from "@/pages/mudur/dashboard";
import { EbeDashboardPage } from "@/pages/ebe/dashboard";
import { GuvenlikDashboardPage } from "@/pages/guvenlik/dashboard";
import { IdariDashboardPage } from "@/pages/idari/dashboard";

function Guard({
  roller,
  children,
}: {
  roller?: string[];
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        {roller?.length ? (
          <RoleGuard roller={roller}>{children}</RoleGuard>
        ) : (
          children
        )}
      </OnboardingGuard>
    </ProtectedRoute>
  );
}

/** /ayarlar → rol ana yolu/ayarlar */
function AyarlarRedirect() {
  const rol = useAuthStore((s) => s.primaryRole());
  const home = homeForRole(rol);
  if (home === "/giris" || home === "/hasta-mobil") {
    return <Navigate to="/giris" replace />;
  }
  return <Navigate to={`${home}/ayarlar`} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/giris" replace />} />
        <Route path="/giris" element={<GirisPage />} />
        <Route path="/sifre-sifirla" element={<SifreSifirlaPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/hasta-mobil" element={<HastaMobilPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route
          path="/ayarlar"
          element={
            <Guard>
              <AyarlarRedirect />
            </Guard>
          }
        />
        <Route path="/sifre-degistir" element={<SifreDegistirPage />} />
        <Route path="/kvkk-onay" element={<KvkkOnayPage />} />
        {/* ADMIN */}
        <Route path="/admin" element={<RoleLayoutRoute rol="ADMIN" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="kullanicilar" element={<KullaniciYonetimiPage />} />
          <Route path="personel" element={<PersonelYonetimiPage />} />
          <Route path="departmanlar" element={<DepartmanYonetimiPage />} />
          <Route path="departmanlar/:departmanId" element={<DepartmanDetayPage />} />
          <Route path="doktorlar" element={<AdminDoktorlarPage />} />
          <Route path="randevular" element={<AdminRandevularPage />} />
          <Route path="raporlar" element={<AdminRaporlarPage />} />
          <Route path="ayarlar" element={<AdminAyarlarPage />} />
        </Route>

        {/* BASHEKIM */}
        <Route path="/bashekim" element={<RoleLayoutRoute rol="BASHEKIM" />}>
          <Route index element={<BashekimDashboardPage />} />
          <Route path="personel" element={<PersonelYonetimiPage />} />
          <Route path="departmanlar" element={<DepartmanYonetimiPage />} />
          <Route path="departmanlar/:departmanId" element={<DepartmanDetayPage />} />
          <Route
            path="randevular"
            element={<PlaceholderPage title="Randevular" />}
          />
          <Route path="nobet" element={<NobetYonetimiPage />} />
          <Route path="temizlik" element={<TemizlikAtaPage />} />
          <Route path="sikayet" element={<SikayetOneriPage />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* MUDUR */}
        <Route path="/mudur" element={<RoleLayoutRoute rol="MUDUR" />}>
          <Route index element={<MudurDashboardPage />} />
          <Route path="personel" element={<PersonelYonetimiPage />} />
          <Route path="departmanlar" element={<DepartmanYonetimiPage />} />
          <Route path="departmanlar/:departmanId" element={<DepartmanDetayPage />} />
          <Route
            path="randevular"
            element={<PlaceholderPage title="Randevular" />}
          />
          <Route path="nobet" element={<NobetYonetimiPage />} />
          <Route path="temizlik" element={<TemizlikAtaPage />} />
          <Route path="sikayet" element={<SikayetOneriPage />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* DOKTOR */}
        <Route path="/doktor" element={<RoleLayoutRoute rol="DOKTOR" />}>
          <Route index element={<DoktorDashboardPage />} />
          <Route path="randevularim" element={<DoktorRandevularimPage />} />
          <Route path="muayene" element={<DoktorMuayeneEkraniPage />} />
          <Route path="tetkik-iste" element={<DoktorTetkikIstePage />} />
          <Route path="hastalarim" element={<DoktorHastalarimPage />} />
          <Route path="profilim" element={<DoktorProfilPage />} />
          <Route path="profil" element={<Navigate to="/doktor/profilim" replace />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* HEMSIRE */}
        <Route path="/hemsire" element={<RoleLayoutRoute rol="HEMSIRE" />}>
          <Route index element={<HemsireDashboardPage />} />
          <Route
            path="departman-randevulari"
            element={<HemsireDepartmanRandevulariPage />}
          />
          <Route path="randevular" element={<Navigate to="/hemsire/departman-randevulari" replace />} />
          <Route path="nobet" element={<NobetYonetimiPage />} />
          <Route path="panel" element={<HemsirePanelPage />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* EBE */}
        <Route path="/ebe" element={<RoleLayoutRoute rol="EBE" />}>
          <Route index element={<EbeDashboardPage />} />
          <Route
            path="departman-randevulari"
            element={<HemsireDepartmanRandevulariPage />}
          />
          <Route path="randevular" element={<Navigate to="/ebe/departman-randevulari" replace />} />
          <Route path="nobet" element={<NobetYonetimiPage />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* LABORANT */}
        <Route path="/laborant" element={<RoleLayoutRoute rol="LABORANT" />}>
          <Route index element={<LaborantDashboardPage />} />
          <Route path="bekleyen" element={<LaborantBekleyenPage />} />
          <Route path="tetkik-sonuc-girisi" element={<LaborantPage />} />
          <Route
            path="sonuc-girisi"
            element={<Navigate to="/laborant/tetkik-sonuc-girisi" replace />}
          />
          <Route
            path="isler"
            element={<Navigate to="/laborant/tetkik-sonuc-girisi" replace />}
          />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* TEMIZLIK */}
        <Route
          path="/temizlik"
          element={<RoleLayoutRoute rol="TEMIZLIK_PERSONELI" />}
        >
          <Route index element={<TemizlikDashboardPage />} />
          <Route path="gorevlerim" element={<TemizlikGorevlerimPage />} />
          <Route
            path="gorevler"
            element={<Navigate to="/temizlik/gorevlerim" replace />}
          />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* GUVENLIK / IDARI */}
        <Route path="/guvenlik" element={<RoleLayoutRoute rol="GUVENLIK" />}>
          <Route index element={<GuvenlikDashboardPage />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>
        <Route path="/idari" element={<RoleLayoutRoute rol="IDARI_PERSONEL" />}>
          <Route index element={<IdariDashboardPage />} />
          <Route path="ayarlar" element={<AyarlarPage />} />
        </Route>

        {/* HASTA — web yok */}
        <Route path="/hasta" element={<Navigate to="/hasta-mobil" replace />} />
        <Route path="/hasta/randevu" element={<Navigate to="/hasta-mobil" replace />} />

        {/* Eski düz path'ler — geriye uyumluluk */}
        <Route
          path="/personel"
          element={
            <Guard roller={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <PersonelYonetimiPage />
            </Guard>
          }
        />
        <Route
          path="/departmanlar"
          element={
            <Guard roller={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <DepartmanYonetimiPage />
            </Guard>
          }
        />
        <Route
          path="/hasta-kayit"
          element={
            <Guard roller={["ADMIN", "IDARI_PERSONEL"]}>
              <HastaKayitPage />
            </Guard>
          }
        />
        <Route
          path="/nobet"
          element={
            <Guard
              roller={[
                "ADMIN",
                "BASHEKIM",
                "MUDUR",
                "DOKTOR",
                "HEMSIRE",
                "EBE",
                "LABORANT",
                "TEMIZLIK_PERSONELI",
              ]}
            >
              <NobetYonetimiPage />
            </Guard>
          }
        />
        <Route
          path="/temizlik-ata"
          element={
            <Guard roller={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <TemizlikAtaPage />
            </Guard>
          }
        />
        <Route
          path="/sikayet"
          element={
            <Guard>
              <SikayetOneriPage />
            </Guard>
          }
        />
        <Route
          path="/kullanicilar"
          element={
            <Guard roller={["ADMIN"]}>
              <KullaniciYonetimiPage />
            </Guard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
