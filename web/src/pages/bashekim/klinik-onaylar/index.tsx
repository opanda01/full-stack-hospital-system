import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Kayit = {
  id: number;
  tur: string;
  icerik: string;
  onay_durumu: string;
  hasta_id: number | null;
};

export function BashekimKlinikOnaylarPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["klinik-onay"],
    queryFn: async () => (await api.get<Kayit[]>("/klinik-onay/")).data,
  });
  const onay = useMutation({
    mutationFn: (id: number) => api.post(`/klinik-onay/${id}/onayla`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["klinik-onay"] });
      qc.invalidateQueries({ queryKey: ["bashekim-ozet"] });
    },
  });
  const red = useMutation({
    mutationFn: (id: number) => api.post(`/klinik-onay/${id}/reddet`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["klinik-onay"] }),
  });

  return (
    <AppShell title="Klinik onaylar" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Reçete / sevk / tıbbi rapor onay kuyruğu. Eski muayene.receteler metni
        korunur; yeni kayıtlar buradadır.
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <ul className="space-y-3">
          {data.map((k) => (
            <li key={k.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {k.tur} · {k.onay_durumu}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{k.icerik}</p>
                </div>
                {k.onay_durumu === "BEKLEMEDE" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onay.mutate(k.id)}>
                      Onayla
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => red.mutate(k.id)}>
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
