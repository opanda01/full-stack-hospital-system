import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GirisPage } from "@/pages/giris";
import { ForbiddenPage } from "@/pages/forbidden";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { BashekimDashboardPage } from "@/pages/bashekim-dashboard";
import { MudurDashboardPage } from "@/pages/mudur-dashboard";
import { DoktorDashboardPage } from "@/pages/doktor-dashboard";
import { DoktorRandevularimPage } from "@/pages/doktor-randevularim";
import { DoktorMuayeneEkraniPage } from "@/pages/doktor-muayene-ekrani";
import { DoktorProfilPage } from "@/pages/doktor-profil";
import { HemsireDashboardPage } from "@/pages/hemsire-dashboard";
import { HemsirePanelPage } from "@/pages/hemsire-panel";
import { EbeDashboardPage } from "@/pages/ebe-dashboard";
import { TemizlikDashboardPage } from "@/pages/temizlik-dashboard";
import { TemizlikGorevlerimPage } from "@/pages/temizlik-gorevlerim";
import { PersonelYonetimiPage } from "@/pages/personel-yonetimi";
import { DepartmanYonetimiPage } from "@/pages/departman-yonetimi";
import { HastaKayitPage } from "@/pages/hasta-kayit";
import { HastaDashboardPage } from "@/pages/hasta-dashboard";
import { HastaRandevuPage } from "@/pages/hasta-randevu";
import { LaborantDashboardPage } from "@/pages/laborant-dashboard";
import { LaborantPage } from "@/pages/laborant";
import { NobetYonetimiPage } from "@/pages/nobet-yonetimi";
import { TemizlikAtaPage } from "@/pages/temizlik-ata";
import { SikayetOneriPage } from "@/pages/sikayet-oneri";
import { KullaniciYonetimiPage } from "@/pages/kullanici-yonetimi";
import { GuvenlikDashboardPage } from "@/pages/guvenlik-dashboard";
import { IdariDashboardPage } from "@/pages/idari-dashboard";
import { ProtectedRoute, RoleGuard } from "@/shared/auth";

function Guard({
  roller,
  children,
}: {
  roller?: string[];
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {roller?.length ? <RoleGuard roller={roller}>{children}</RoleGuard> : children}
    </ProtectedRoute>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/giris" replace />} />
        <Route path="/giris" element={<GirisPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route
          path="/admin"
          element={
            <Guard roller={["ADMIN"]}>
              <AdminDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/bashekim"
          element={
            <Guard roller={["BASHEKIM"]}>
              <BashekimDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/mudur"
          element={
            <Guard roller={["MUDUR"]}>
              <MudurDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/doktor"
          element={
            <Guard roller={["DOKTOR"]}>
              <DoktorDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/doktor/randevularim"
          element={
            <Guard roller={["DOKTOR"]}>
              <DoktorRandevularimPage />
            </Guard>
          }
        />
        <Route
          path="/doktor/muayene"
          element={
            <Guard roller={["DOKTOR"]}>
              <DoktorMuayeneEkraniPage />
            </Guard>
          }
        />
        <Route
          path="/doktor/profil"
          element={
            <Guard roller={["DOKTOR"]}>
              <DoktorProfilPage />
            </Guard>
          }
        />
        <Route
          path="/hemsire"
          element={
            <Guard roller={["HEMSIRE"]}>
              <HemsireDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/hemsire/panel"
          element={
            <Guard roller={["HEMSIRE", "EBE"]}>
              <HemsirePanelPage />
            </Guard>
          }
        />
        <Route
          path="/ebe"
          element={
            <Guard roller={["EBE"]}>
              <EbeDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/temizlik"
          element={
            <Guard roller={["TEMIZLIK_PERSONELI"]}>
              <TemizlikDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/temizlik/gorevler"
          element={
            <Guard roller={["TEMIZLIK_PERSONELI"]}>
              <TemizlikGorevlerimPage />
            </Guard>
          }
        />
        <Route
          path="/laborant"
          element={
            <Guard roller={["LABORANT"]}>
              <LaborantDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/laborant/isler"
          element={
            <Guard roller={["LABORANT", "ADMIN"]}>
              <LaborantPage />
            </Guard>
          }
        />
        <Route
          path="/hasta"
          element={
            <Guard roller={["HASTA"]}>
              <HastaDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/hasta/randevu"
          element={
            <Guard roller={["HASTA"]}>
              <HastaRandevuPage />
            </Guard>
          }
        />
        <Route
          path="/guvenlik"
          element={
            <Guard roller={["GUVENLIK"]}>
              <GuvenlikDashboardPage />
            </Guard>
          }
        />
        <Route
          path="/idari"
          element={
            <Guard roller={["IDARI_PERSONEL"]}>
              <IdariDashboardPage />
            </Guard>
          }
        />
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
