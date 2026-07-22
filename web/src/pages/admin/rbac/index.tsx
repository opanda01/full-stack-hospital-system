import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Rol = { id: number; kod: string; ad: string };
type IzinDetay = { kod: string; kapsam?: string; ad?: string };

export function AdminRbacPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const [seciliRol, setSeciliRol] = useState("ADMIN");
  const {
    data: roller = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["rbac-roller"],
    queryFn: async () => (await api.get<Rol[]>("/rbac/roller")).data,
  });

  const { data: izinler = [], isLoading: izinLoading } = useQuery({
    queryKey: ["rbac-izinler", seciliRol],
    queryFn: async () =>
      (await api.get<IzinDetay[]>(`/rbac/roller/${seciliRol}/izinler`)).data,
    enabled: Boolean(seciliRol),
  });

  return (
    <AppShell title="Roller ve izinler" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        İzin matrisi kod tabanlıdır (salt okunur). Başhekim / Müdür ayrımı için
        docs/bashekim-izin-envanteri.md.
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <ul className="space-y-1 rounded-xl border border-border bg-card p-3">
            {roller.map((r) => (
              <li key={r.kod}>
                <button
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    seciliRol === r.kod
                      ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSeciliRol(r.kod)}
                >
                  {r.kod}
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 font-semibold">{seciliRol} izinleri</h3>
            {izinLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            ) : izinler.length === 0 ? (
              <p className="text-sm text-muted-foreground">İzin yok / *</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {izinler.map((i) => (
                  <li key={i.kod} className="border-b border-border py-1.5">
                    <code>{i.kod}</code>
                    {i.kapsam ? (
                      <span className="ml-2 text-muted-foreground">
                        ({i.kapsam})
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
