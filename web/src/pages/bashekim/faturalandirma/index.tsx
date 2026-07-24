import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Fatura = {
  id: number;
  hasta_id: string | null;
  tutar: string | number;
  durum: string;
  aciklama: string | null;
  medula_takip_no?: string | null;
  gonderim_durumu?: string | null;
};

export function BashekimFaturalandirmaPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["faturalar"],
    queryFn: async () => (await api.get<Fatura[]>("/faturalar/")).data,
  });
  const medula = useMutation({
    mutationFn: async (id: number) =>
      api.post(`/faturalar/${id}/medula-gonder`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faturalar"] }),
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
              <th>MEDULA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="py-2">{f.id}</td>
                <td>{f.hasta_id ?? "—"}</td>
                <td>{f.tutar}</td>
                <td>{f.durum}</td>
                <td>{f.gonderim_durumu ?? "—"}</td>
                <td>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={medula.isPending}
                    onClick={() => medula.mutate(f.id)}
                  >
                    MEDULA&apos;ya gönder (mock)
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {medula.isError && (
        <p className="mt-2 text-sm text-red-600">
          {getApiErrorMessage(medula.error)}
        </p>
      )}
    </AppShell>
  );
}
