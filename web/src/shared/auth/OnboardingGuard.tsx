import { Navigate, useLocation } from "react-router-dom";
import {
  needsOnboarding,
  onboardingPath,
  useAuthStore,
} from "./authStore";

const ONBOARDING_PATHS = new Set([
  "/sifre-degistir",
  "/kvkk-onay",
  "/giris",
  "/sifre-sifirla",
]);

/** Panel route'larında ilk giriş / KVKK tamamlanmadıysa yönlendirir. */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const location = useLocation();

  if (ONBOARDING_PATHS.has(location.pathname)) {
    return <>{children}</>;
  }

  if (currentUser && needsOnboarding(currentUser)) {
    return <Navigate to={onboardingPath(currentUser)} replace />;
  }

  return <>{children}</>;
}
