import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { TemizlikGoreviTamamlaButton } from "@/features/temizlik-gorevi-tamamla";

type Gorev = {
  id: number;
  oda_bolum: string;
  gorev_tarihi: string;
  durum: string;
};

export function TemizlikGorevlerimPage() {
  const { data = [] } = useQuery({
    queryKey: ["temizlik"],
    queryFn: async () => (await api.get<Gorev[]>("/temizlik-gorevleri/")).data,
  });

  return (
    <AppShell
      title="Temizlik Görevlerim"
      links={[
        { to: "/nobet", label: "Nöbetlerim" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    >
      <ul className="space-y-2">
        {data.map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between rounded border bg-card p-3 text-sm"
          >
            <span>
              {g.oda_bolum} — {g.gorev_tarihi} — {g.durum}
            </span>
            {g.durum !== "TAMAMLANDI" && (
              <TemizlikGoreviTamamlaButton gorevId={g.id} />
            )}
          </li>
        ))}
        {!data.length && (
          <p className="text-muted-foreground">Atanmış görev yok.</p>
        )}
      </ul>
    </AppShell>
  );
}
