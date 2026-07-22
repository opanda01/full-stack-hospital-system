import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/shared/auth/authStore";
import { NAV_GROUPS, type Rol } from "@/shared/config/nav-items";
import { AppShell } from "@/shared/ui/app-shell";
import { OnboardingGuard } from "./OnboardingGuard";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleGuard } from "./RoleGuard";

type RoleLayoutRouteProps = {
  rol: Rol;
};

/**
 * AppShell'i ilgili rolün NAV_GROUPS'ı ile sarmalar; alt route'lar <Outlet /> ile gelir.
 */
export function RoleLayoutRoute({ rol }: RoleLayoutRouteProps) {
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        <RoleGuard roller={[rol]}>
          <RoleLayoutInner rol={rol} />
        </RoleGuard>
      </OnboardingGuard>
    </ProtectedRoute>
  );
}

function RoleLayoutInner({ rol }: { rol: Rol }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const hasRole = useAuthStore((s) => s.hasRole);

  if (currentUser?.rol === "HASTA" || hasRole("HASTA")) {
    return <Navigate to="/hasta-mobil" replace />;
  }

  if (!currentUser) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <AppShell navGroups={NAV_GROUPS[rol]} currentUser={currentUser}>
      <Outlet />
    </AppShell>
  );
}
