import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Doner = {
  id: number;
  donem: string;
  gelir: string | number;
  gider: string | number;
  net: string | number;
  aciklama: string | null;
};

export function BashekimDonerSermayePage() {
  const root = roleRootFromPath(useLocation().pathname);
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["doner"],
    queryFn: async () => (await api.get<Doner[]>("/doner-sermaye/")).data,
  });
  return (
    <AppShell title="Döner sermaye" links={[{ to: root, label: "Ana" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Dönem</th>
              <th>Gelir</th>
              <th>Gider</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2">{d.donem}</td>
                <td>{d.gelir}</td>
                <td>{d.gider}</td>
                <td>{d.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
