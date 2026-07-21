import { cn } from "@/shared/lib/utils";
import { useThemeStore, type ThemeName } from "@/shared/theme";

const TEMA_SECENEKLERI: {
  key: ThemeName;
  label: string;
  onizlemeBg: string;
  onizlemeAccent: string;
}[] = [
  { key: "acik", label: "Açık", onizlemeBg: "#ffffff", onizlemeAccent: "#0f6e56" },
  { key: "koyu", label: "Koyu", onizlemeBg: "#1e1e1e", onizlemeAccent: "#1d9e75" },
  { key: "oled", label: "OLED", onizlemeBg: "#000000", onizlemeAccent: "#0f6e56" },
];

/** Tema seçici — Görünüm kartı. */
export function TemaSecici() {
  const tema = useThemeStore((s) => s.tema);
  const setTema = useThemeStore((s) => s.setTema);

  return (
    <section
      className="rounded-[20px] p-5"
      style={{ background: "var(--panel-inset-bg)" }}
    >
      <h2
        className="text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Görünüm
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Uygulama temasını seçin. Tercihiniz bu cihazda saklanır.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {TEMA_SECENEKLERI.map((secenek) => {
          const secili = tema === secenek.key;
          return (
            <button
              key={secenek.key}
              type="button"
              onClick={() => setTema(secenek.key)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-[16px] p-4 text-left transition-shadow",
                secili ? "shadow-sm" : "hover:opacity-90",
              )}
              style={{
                background: "var(--panel-bg)",
                border: secili
                  ? "2px solid var(--border-accent)"
                  : "2px solid transparent",
              }}
              aria-pressed={secili}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-10 w-10 rounded-full border shadow-inner"
                  style={{
                    background: secenek.onizlemeBg,
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ background: secenek.onizlemeAccent }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {secenek.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
