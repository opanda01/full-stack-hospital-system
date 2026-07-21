import { TemaSecici } from "./TemaSecici";

export function AyarlarPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Ayarlar
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Görünüm ve tercihlerinizi yönetin
        </p>
      </div>
      <TemaSecici />
    </div>
  );
}

/** Admin route uyumluluğu */
export { AyarlarPage as AdminAyarlarPage };
