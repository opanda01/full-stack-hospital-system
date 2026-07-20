import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Gorev = {
  id: number;
  oda_bolum: string;
  gorev_tarihi: string;
  durum: string;
};

export function TemizlikGorevlerimPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["temizlik"],
    queryFn: async () => (await api.get<Gorev[]>("/temizlik-gorevleri/")).data,
  });
  const tamamla = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/temizlik-gorevleri/${id}`, { durum: "TAMAMLANDI" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temizlik"] }),
  });

  return (
    <AppShell title="Temizlik Görevlerim">
      <ul className="space-y-2">
        {data.map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between rounded border bg-white p-3 text-sm"
          >
            <span>
              {g.oda_bolum} — {g.gorev_tarihi} — {g.durum}
            </span>
            {g.durum !== "TAMAMLANDI" && (
              <Button type="button" onClick={() => tamamla.mutate(g.id)}>
                Tamamla
              </Button>
            )}
          </li>
        ))}
        {!data.length && <p className="text-slate-500">Atanmış görev yok.</p>}
      </ul>
    </AppShell>
  );
}
