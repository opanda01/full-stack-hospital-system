import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Personel = { id: number; sicil_no: string; unvan: string | null };
type Gorev = {
  id: number;
  personel_id: number;
  oda_bolum: string;
  gorev_tarihi: string;
  durum: string;
};

export function TemizlikAtaPage() {
  const qc = useQueryClient();
  const { data: personeller = [] } = useQuery({
    queryKey: ["personeller"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });
  const { data: gorevler = [] } = useQuery({
    queryKey: ["temizlik-yonetim"],
    queryFn: async () => (await api.get<Gorev[]>("/temizlik-gorevleri/")).data,
  });

  const [personelId, setPersonelId] = useState("");
  const [oda, setOda] = useState("");
  const [tarih, setTarih] = useState("");

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/temizlik-gorevleri/", {
        personel_id: Number(personelId),
        oda_bolum: oda,
        gorev_tarihi: tarih,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["temizlik-yonetim"] });
      setOda("");
      setPersonelId("");
    },
  });

  const temizlikPersonel = personeller.filter(
    (p) => (p.unvan || "").includes("TEMIZLIK") || true,
  );

  return (
    <AppShell
      title="Temizlik Görevi Ata"
      links={[{ to: "/admin", label: "Admin" }]}
    >
      <form
        className="mb-6 flex flex-wrap gap-2 rounded border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <select
          className="rounded border px-3 py-2"
          value={personelId}
          onChange={(e) => setPersonelId(e.target.value)}
          required
        >
          <option value="">Personel</option>
          {temizlikPersonel.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} {p.sicil_no} ({p.unvan})
            </option>
          ))}
        </select>
        <input
          className="rounded border px-3 py-2"
          placeholder="Oda / bölüm"
          value={oda}
          onChange={(e) => setOda(e.target.value)}
          required
        />
        <input
          type="date"
          className="rounded border px-3 py-2"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          required
        />
        <Button type="submit">Ata</Button>
      </form>
      <ul className="space-y-2">
        {gorevler.map((g) => (
          <li key={g.id} className="rounded border bg-card px-3 py-2 text-sm">
            #{g.id} — {g.oda_bolum} — personel {g.personel_id} — {g.gorev_tarihi}{" "}
            — {g.durum}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
