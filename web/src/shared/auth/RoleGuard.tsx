import { Navigate } from "react-router-dom";
import { useAuthStore } from "./authStore";

/** Rol uymuyorsa /403 sayfasına yönlendirir. */
export function RoleGuard({
  roller,
  children,
}: {
  roller: string[];
  children: React.ReactNode;
}) {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (roller.length && !hasRole(...roller)) {
    return <Navigate to="/403" replace />;
  }
  return <>{children}</>;
}
