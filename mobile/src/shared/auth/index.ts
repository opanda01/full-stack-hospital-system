import { storageDelete, storageGet, storageSet } from "./storage";
import { create } from "zustand";

const ACCESS_KEY = "hbys_access_token";
const REFRESH_KEY = "hbys_refresh_token";
const ROL_KEY = "hbys_rol";

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  rol: string | null;
  hydrated: boolean;
  setAuth: (access: string, refresh: string, rol: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  rol: null,
  hydrated: false,

  setAuth: async (access, refresh, rol) => {
    await storageSet(ACCESS_KEY, access);
    await storageSet(REFRESH_KEY, refresh);
    await storageSet(ROL_KEY, rol);
    set({ token: access, refreshToken: refresh, rol });
  },

  clearAuth: async () => {
    await storageDelete(ACCESS_KEY);
    await storageDelete(REFRESH_KEY);
    await storageDelete(ROL_KEY);
    set({ token: null, refreshToken: null, rol: null });
  },

  hydrate: async () => {
    try {
      const [token, refreshToken, rol] = await Promise.all([
        storageGet(ACCESS_KEY),
        storageGet(REFRESH_KEY),
        storageGet(ROL_KEY),
      ]);
      set({
        token,
        refreshToken,
        rol,
        hydrated: true,
      });
    } catch {
      set({ token: null, refreshToken: null, rol: null, hydrated: true });
    }
  },
}));
