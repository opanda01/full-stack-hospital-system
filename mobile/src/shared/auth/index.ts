import { create } from "zustand";

type AuthState = {
  token: string | null;
  rol: string | null;
  setAuth: (token: string, rol: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  rol: null,
  setAuth: (token, rol) => set({ token, rol }),
  logout: () => set({ token: null, rol: null }),
}));
