import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Fatura = {
  id: number;
  hasta_id: number | null;
  tutar: string | number;
  durum: string;
  aciklama: string | null;
};

export function BashekimFaturalandirmaPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["faturalar"],
    queryFn: async () => (await api.get<Fatura[]>("/faturalar/")).data,
  });
  return (
    <AppShell title="Faturalandırma" links={[{ to: root, label: "Ana" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">ID</th>
              <th>Hasta</th>
              <th>Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="py-2">{f.id}</td>
                <td>{f.hasta_id ?? "—"}</td>
                <td>{f.tutar}</td>
                <td>{f.durum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
