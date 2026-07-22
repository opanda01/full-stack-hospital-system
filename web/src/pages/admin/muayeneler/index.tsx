import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Muayene = {
  id: number;
  randevu_id?: number;
  doktor_id?: number;
  hasta_id?: number;
  tani?: string | null;
  created_at?: string;
  olusturma_tarihi?: string;
};

export function AdminMuayenelerPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["muayeneler"],
    queryFn: async () => (await api.get<Muayene[]>("/muayeneler/")).data,
  });

  return (
    <AppShell title="Muayene özeti" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Sistem genelinde muayene kayıtlarının özet listesi.
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Muayene kaydı yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">ID</th>
              <th>Randevu</th>
              <th>Hasta</th>
              <th>Doktor</th>
              <th>Tanı</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2">{m.id}</td>
                <td>{m.randevu_id ?? "—"}</td>
                <td>{m.hasta_id ?? "—"}</td>
                <td>{m.doktor_id ?? "—"}</td>
                <td>{m.tani ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
