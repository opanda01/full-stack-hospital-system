import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Muayene = {
  id: number;
  randevu_id: number;
  tani: string | null;
  bulasici_bildirim_mi: boolean;
  adli_vaka_mi: boolean;
  olum_bildirim_mi: boolean;
};

function bayraklar(m: Muayene): string {
  const parts: string[] = [];
  if (m.bulasici_bildirim_mi) parts.push("Bulaşıcı");
  if (m.adli_vaka_mi) parts.push("Adli");
  if (m.olum_bildirim_mi) parts.push("Ölüm");
  return parts.join(", ");
}

export function BashekimZorunluBildirimlerPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["zorunlu-bildirimler"],
    queryFn: async () =>
      (await api.get<Muayene[]>("/muayeneler/zorunlu-bildirimler")).data,
  });

  const gonder = useMutation({
    mutationFn: (id: number) =>
      api.post(`/muayeneler/${id}/zorunlu-bildirim-gonder`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zorunlu-bildirimler"] });
      qc.invalidateQueries({ queryKey: ["entegrasyon-outbox"] });
    },
  });

  return (
    <AppShell
      title="Zorunlu Bildirimler (BBY Mock)"
      links={[
        { to: "/bashekim", label: "Ana" },
        { to: "/bashekim/entegrasyonlar", label: "Entegrasyonlar" },
      ]}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Bayraklı muayene kayıtları. Mock BBY gönderimi entegrasyon outbox&apos;ına
        kayıt düşer (prod portal bağlantısı yok).
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">Bildirim bekleyen muayene yok.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Muayene</th>
              <th>Tanı</th>
              <th>Bayraklar</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2">#{m.id}</td>
                <td className="max-w-xs truncate">{m.tani ?? "—"}</td>
                <td>{bayraklar(m)}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={gonder.isPending}
                    onClick={() => gonder.mutate(m.id)}
                  >
                    Mock gönder
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {gonder.isError && (
        <p className="mt-2 text-sm text-red-600">
          {getApiErrorMessage(gonder.error)}
        </p>
      )}
    </AppShell>
  );
}
