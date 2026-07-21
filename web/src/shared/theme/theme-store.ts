import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME, type ThemeName } from "./theme-tokens";

interface ThemeStore {
  tema: ThemeName;
  setTema: (tema: ThemeName) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      tema: DEFAULT_THEME,
      setTema: (tema) => set({ tema }),
    }),
    {
      name: "hastane-tema",
    },
  ),
);
