import { useLocation } from "react-router-dom";
import {
  roleBasePathFromPathname,
  useAuthStore,
} from "@/shared/auth/authStore";

/** Shared hemsire/ebe page components: `/hemsire` or `/ebe` from URL (or rol). */
export function useRoleBasePath(): string {
  const { pathname } = useLocation();
  const rol = useAuthStore((s) => s.user?.rol);
  return roleBasePathFromPathname(pathname, rol);
}
