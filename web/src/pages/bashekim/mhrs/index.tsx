import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Kapasite = {
  id: number;
  departman_id: number;
  doktor_id: number | null;
  tarih: string;
  slot_sayisi: number;
  kaynak: string;
  son_senkron: string | null;
};

export function BashekimMhrsPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["mhrs"],
    queryFn: async () => (await api.get<Kapasite[]>("/mhrs/")).data,
  });
  const senkron = useMutation({
    mutationFn: (id: number) => api.post(`/mhrs/${id}/senkron`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mhrs"] }),
  });

  return (
    <AppShell title="MHRS kapasite" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Branş/hekim randevu kapasitesi (mock MHRS senkron).
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Tarih</th>
              <th>Departman</th>
              <th>Slot</th>
              <th>Kaynak</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.tarih}</td>
                <td>#{r.departman_id}</td>
                <td>{r.slot_sayisi}</td>
                <td>{r.kaynak}</td>
                <td className="text-right">
                  <Button size="sm" variant="outline" onClick={() => senkron.mutate(r.id)}>
                    Senkron
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
