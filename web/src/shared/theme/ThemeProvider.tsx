import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useThemeStore } from "./theme-store";
import { applyThemeToDocument, DEFAULT_THEME } from "./theme-tokens";

/** Store'daki temayı documentElement CSS değişkenlerine yazar. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const tema = useThemeStore((s) => s.tema);

  useLayoutEffect(() => {
    applyThemeToDocument(tema);
  }, [tema]);

  useEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration((state) => {
      applyThemeToDocument(state?.tema ?? DEFAULT_THEME);
    });
    if (useThemeStore.persist.hasHydrated()) {
      applyThemeToDocument(useThemeStore.getState().tema);
    }
    return unsub;
  }, []);

  return <>{children}</>;
}
