import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
  setAuth: (
    token: string,
    roles: string[],
    permissions?: string[],
    refreshToken?: string | null,
  ) => void;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  hasPermission: (...codes: string[]) => boolean;
  primaryRole: () => string | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      roles: [],
      permissions: [],
      setAuth: (token, roles, permissions = [], refreshToken = null) =>
        set({ token, roles, permissions, refreshToken }),
      logout: () =>
        set({ token: null, refreshToken: null, roles: [], permissions: [] }),
      hasRole: (...roles) => roles.some((r) => get().roles.includes(r)),
      hasPermission: (...codes) => {
        const perms = get().permissions;
        if (perms.includes("*")) return true;
        return codes.some((c) => perms.includes(c));
      },
      primaryRole: () => get().roles[0] ?? null,
    }),
    { name: "hastane-auth" },
  ),
);

export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  BASHEKIM: "/admin",
  MUDUR: "/admin",
  DOKTOR: "/doktor/randevularim",
  HEMSIRE: "/hemsire",
  EBE: "/hemsire",
  TEMIZLIK_PERSONELI: "/temizlik",
  HASTA: "/hasta",
  LABORANT: "/laborant",
  GUVENLIK: "/admin",
  IDARI_PERSONEL: "/hasta-kayit",
};

export function homeForRole(rol: string | null | undefined): string {
  if (!rol) return "/giris";
  return ROLE_HOME[rol] ?? "/giris";
}
