import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GirisPage } from "@/pages/giris";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { DoktorRandevularimPage } from "@/pages/doktor-randevularim";
import { DoktorMuayeneEkraniPage } from "@/pages/doktor-muayene-ekrani";
import { DoktorProfilPage } from "@/pages/doktor-profil";
import { HemsirePanelPage } from "@/pages/hemsire-panel";
import { TemizlikGorevlerimPage } from "@/pages/temizlik-gorevlerim";
import { PersonelYonetimiPage } from "@/pages/personel-yonetimi";
import { DepartmanYonetimiPage } from "@/pages/departman-yonetimi";
import { HastaKayitPage } from "@/pages/hasta-kayit";
import { HastaDashboardPage } from "@/pages/hasta-dashboard";
import { HastaRandevuPage } from "@/pages/hasta-randevu";
import { LaborantPage } from "@/pages/laborant";
import { NobetYonetimiPage } from "@/pages/nobet-yonetimi";
import { TemizlikAtaPage } from "@/pages/temizlik-ata";
import { SikayetOneriPage } from "@/pages/sikayet-oneri";
import { KullaniciYonetimiPage } from "@/pages/kullanici-yonetimi";
import { homeForRole, useAuthStore } from "@/shared/auth";

function RequireAuth({
  roles,
  children,
}: {
  roles?: string[];
  children: React.ReactNode;
}) {
  const { token, hasRole, primaryRole } = useAuthStore();
  if (!token) return <Navigate to="/giris" replace />;
  if (roles?.length && !hasRole(...roles)) {
    return <Navigate to={homeForRole(primaryRole())} replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/giris" replace />} />
        <Route path="/giris" element={<GirisPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <AdminDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/doktor/randevularim"
          element={
            <RequireAuth roles={["DOKTOR"]}>
              <DoktorRandevularimPage />
            </RequireAuth>
          }
        />
        <Route
          path="/doktor/muayene"
          element={
            <RequireAuth roles={["DOKTOR"]}>
              <DoktorMuayeneEkraniPage />
            </RequireAuth>
          }
        />
        <Route
          path="/doktor/profil"
          element={
            <RequireAuth roles={["DOKTOR"]}>
              <DoktorProfilPage />
            </RequireAuth>
          }
        />
        <Route
          path="/hemsire"
          element={
            <RequireAuth roles={["HEMSIRE", "EBE"]}>
              <HemsirePanelPage />
            </RequireAuth>
          }
        />
        <Route
          path="/temizlik"
          element={
            <RequireAuth roles={["TEMIZLIK_PERSONELI"]}>
              <TemizlikGorevlerimPage />
            </RequireAuth>
          }
        />
        <Route
          path="/laborant"
          element={
            <RequireAuth roles={["LABORANT", "ADMIN"]}>
              <LaborantPage />
            </RequireAuth>
          }
        />
        <Route
          path="/hasta"
          element={
            <RequireAuth roles={["HASTA"]}>
              <HastaDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/hasta/randevu"
          element={
            <RequireAuth roles={["HASTA"]}>
              <HastaRandevuPage />
            </RequireAuth>
          }
        />
        <Route
          path="/personel"
          element={
            <RequireAuth roles={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <PersonelYonetimiPage />
            </RequireAuth>
          }
        />
        <Route
          path="/departmanlar"
          element={
            <RequireAuth roles={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <DepartmanYonetimiPage />
            </RequireAuth>
          }
        />
        <Route
          path="/hasta-kayit"
          element={
            <RequireAuth roles={["ADMIN", "IDARI_PERSONEL"]}>
              <HastaKayitPage />
            </RequireAuth>
          }
        />
        <Route
          path="/nobet"
          element={
            <RequireAuth
              roles={[
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
            </RequireAuth>
          }
        />
        <Route
          path="/temizlik-ata"
          element={
            <RequireAuth roles={["ADMIN", "BASHEKIM", "MUDUR"]}>
              <TemizlikAtaPage />
            </RequireAuth>
          }
        />
        <Route
          path="/sikayet"
          element={
            <RequireAuth>
              <SikayetOneriPage />
            </RequireAuth>
          }
        />
        <Route
          path="/kullanicilar"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <KullaniciYonetimiPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
