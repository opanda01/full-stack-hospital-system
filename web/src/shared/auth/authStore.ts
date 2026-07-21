import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "./authService";

export type CurrentUser = {
  id: number;
  email: string;
  ad: string;
  soyad: string;
  rol: string;
  aktif_mi: boolean;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  /** @deprecated use accessToken — geriye uyum */
  token: string | null;
  currentUser: CurrentUser | null;
  roles: string[];
  permissions: string[];
  setTokens: (accessToken: string, refreshToken: string | null) => void;
  setAuth: (
    accessToken: string,
    roles: string[],
    permissions?: string[],
    refreshToken?: string | null,
    currentUser?: CurrentUser | null,
  ) => void;
  login: (email: string, sifre: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<CurrentUser>;
  hasRole: (...roles: string[]) => boolean;
  hasPermission: (...codes: string[]) => boolean;
  primaryRole: () => string | null;
  clear: () => void;
};

const empty = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  token: null as string | null,
  currentUser: null as CurrentUser | null,
  roles: [] as string[],
  permissions: [] as string[],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...empty,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, token: accessToken }),
      setAuth: (
        accessToken,
        roles,
        permissions = [],
        refreshToken = null,
        currentUser = null,
      ) =>
        set({
          accessToken,
          token: accessToken,
          refreshToken,
          roles,
          permissions,
          currentUser,
        }),
      login: async (email, sifre) => {
        const res = await authService.login(email, sifre);
        get().setAuth(
          res.access_token,
          [res.rol],
          res.permissions,
          res.refresh_token,
          res.user,
        );
        const me = await get().fetchMe();
        return me;
      },
      logout: async () => {
        const { accessToken, refreshToken } = get();
        try {
          if (accessToken && refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch {
          // sunucu reddetse bile lokal temizle
        }
        get().clear();
      },
      fetchMe: async () => {
        const me = await authService.me();
        set({
          currentUser: me,
          roles: [me.rol],
        });
        return me;
      },
      hasRole: (...roles) => roles.some((r) => get().roles.includes(r)),
      hasPermission: (...codes) => {
        const perms = get().permissions;
        if (perms.includes("*")) return true;
        return codes.some((c) => perms.includes(c));
      },
      primaryRole: () => get().roles[0] ?? get().currentUser?.rol ?? null,
      clear: () => set({ ...empty }),
    }),
    {
      name: "hastane-auth",
      partialize: (s) => ({
        accessToken: s.accessToken ?? s.token,
        refreshToken: s.refreshToken,
        token: s.accessToken ?? s.token,
        currentUser: s.currentUser,
        roles: s.roles,
        permissions: s.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.accessToken && state.token) {
          state.accessToken = state.token;
        }
      },
    },
  ),
);

export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  BASHEKIM: "/bashekim",
  MUDUR: "/mudur",
  DOKTOR: "/doktor",
  HEMSIRE: "/hemsire",
  EBE: "/ebe",
  TEMIZLIK_PERSONELI: "/temizlik",
  /** HASTA web paneline giremez — mobil uyarı sayfası */
  HASTA: "/hasta-mobil",
  LABORANT: "/laborant",
  GUVENLIK: "/guvenlik",
  IDARI_PERSONEL: "/idari",
};

export function homeForRole(rol: string | null | undefined): string {
  if (!rol) return "/giris";
  return ROLE_HOME[rol] ?? "/giris";
}
