import { Navigate } from "react-router-dom";
import { useAuthStore } from "./authStore";

/** Token yoksa /giris'e yönlendirir. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken ?? s.token);
  if (!accessToken) return <Navigate to="/giris" replace />;
  return <>{children}</>;
}
