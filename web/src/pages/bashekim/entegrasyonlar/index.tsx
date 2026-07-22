import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Enteg = {
  id: number;
  sistem: string;
  durum: string;
  son_senkron: string | null;
  hata_ozeti: string | null;
};

export function BashekimEntegrasyonlarPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["entegrasyonlar"],
    queryFn: async () => (await api.get<Enteg[]>("/entegrasyonlar/")).data,
  });
  const senkron = useMutation({
    mutationFn: (sistem: string) => api.post(`/entegrasyonlar/${sistem}/senkron`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entegrasyonlar"] }),
  });

  return (
    <AppShell title="Entegrasyonlar" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        E-Nabız / SGK provizyon durumu (mock senkron).
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <div className="space-y-3">
          {data.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-xl border border-border p-4"
            >
              <div>
                <div className="font-medium">{e.sistem}</div>
                <div className="text-sm text-muted-foreground">
                  {e.durum}
                  {e.son_senkron
                    ? ` · ${new Date(e.son_senkron).toLocaleString("tr-TR")}`
                    : ""}
                </div>
                {e.hata_ozeti && (
                  <div className="text-sm text-red-600">{e.hata_ozeti}</div>
                )}
              </div>
              <Button size="sm" onClick={() => senkron.mutate(e.sistem)}>
                Senkron dene
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
