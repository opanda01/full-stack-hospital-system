import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Tetkik = {
  id: number;
  tetkik_turu?: string;
  durum: string;
  hasta_id?: number;
  doktor_id?: number;
};

export function AdminTetkiklerPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["tetkikler"],
    queryFn: async () => (await api.get<Tetkik[]>("/tetkikler/")).data,
  });

  return (
    <AppShell title="Tetkik özeti" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Sistem genelinde tetkik isteklerinin özet listesi.
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tetkik kaydı yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">ID</th>
              <th>Tür</th>
              <th>Durum</th>
              <th>Hasta</th>
              <th>Doktor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.id}</td>
                <td>{t.tetkik_turu ?? "—"}</td>
                <td>{t.durum}</td>
                <td>{t.hasta_id ?? "—"}</td>
                <td>{t.doktor_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
