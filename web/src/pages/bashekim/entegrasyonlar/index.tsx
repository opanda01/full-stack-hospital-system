import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Enteg = {
  id: number;
  sistem: string;
  durum: string;
  son_senkron: string | null;
  hata_ozeti: string | null;
};

type Outbox = {
  id: number;
  sistem: string;
  kaynak: string;
  kaynak_id: string;
  durum: string;
  dis_referans: string | null;
  son_hata: string | null;
  deneme: number;
};

export function BashekimEntegrasyonlarPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["entegrasyonlar"],
    queryFn: async () => (await api.get<Enteg[]>("/entegrasyonlar/")).data,
  });
  const { data: outbox = [] } = useQuery({
    queryKey: ["entegrasyon-outbox"],
    queryFn: async () => (await api.get<Outbox[]>("/entegrasyonlar/outbox")).data,
  });
  const senkron = useMutation({
    mutationFn: (sistem: string) => api.post(`/entegrasyonlar/${sistem}/senkron`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entegrasyonlar"] }),
  });
  const retry = useMutation({
    mutationFn: (id: number) => api.post(`/entegrasyonlar/outbox/${id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entegrasyon-outbox"] }),
  });

  return (
    <AppShell title="Entegrasyonlar" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Canlı geçiş için `docs/integrations/LIVE-CHECKLIST.md`. E-Nabız / SGK / KPS
        durum özeti ve outbox yeniden deneme.
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

      <h2 className="mb-2 mt-8 text-lg font-medium">Outbox kuyruğu</h2>
      {outbox.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kayıt yok.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">ID</th>
              <th>Sistem</th>
              <th>Durum</th>
              <th>Hata</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {outbox.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2">{o.id}</td>
                <td>
                  {o.sistem} / {o.kaynak}:{o.kaynak_id}
                </td>
                <td>
                  {o.durum} (d:{o.deneme})
                </td>
                <td className="max-w-xs truncate text-red-600">
                  {o.son_hata ?? "—"}
                </td>
                <td>
                  {o.durum === "HATA" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retry.mutate(o.id)}
                    >
                      Yeniden dene
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
