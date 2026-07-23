import * as SecureStore from "expo-secure-store";
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
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    await SecureStore.setItemAsync(ROL_KEY, rol);
    set({ token: access, refreshToken: refresh, rol });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(ROL_KEY);
    set({ token: null, refreshToken: null, rol: null });
  },

  hydrate: async () => {
    try {
      const [token, refreshToken, rol] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
        SecureStore.getItemAsync(ROL_KEY),
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
