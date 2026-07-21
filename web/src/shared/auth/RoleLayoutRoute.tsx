import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/shared/auth/authStore";
import { NAV_ITEMS, type Rol } from "@/shared/config/nav-items";
import { AppShell } from "@/shared/ui/app-shell";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleGuard } from "./RoleGuard";

type RoleLayoutRouteProps = {
  rol: Rol;
};

/**
 * AppShell'i ilgili rolün NAV_ITEMS'ı ile sarmalar; alt route'lar <Outlet /> ile gelir.
 */
export function RoleLayoutRoute({ rol }: RoleLayoutRouteProps) {
  return (
    <ProtectedRoute>
      <RoleGuard roller={[rol]}>
        <RoleLayoutInner rol={rol} />
      </RoleGuard>
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
    <AppShell navItems={NAV_ITEMS[rol]} currentUser={currentUser}>
      <Outlet />
    </AppShell>
  );
}
