import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";

type Nobet = {
  id: number;
  personel_id: number;
  tarih: string;
  vardiya: string;
  departman_id: number;
};
type Personel = { id: number; sicil_no: string; unvan: string | null };
type Departman = { id: number; ad: string };

export function NobetYonetimiPage() {
  const qc = useQueryClient();
  const canCreate = useAuthStore((s) =>
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );
  const { data: nobetler = [] } = useQuery({
    queryKey: ["nobetler"],
    queryFn: async () => (await api.get<Nobet[]>("/nobet-cizelgesi/")).data,
  });
  const { data: personeller = [] } = useQuery({
    queryKey: ["personeller"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
    enabled: canCreate,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
    enabled: canCreate,
  });

  const [personelId, setPersonelId] = useState("");
  const [departmanId, setDepartmanId] = useState("");
  const [tarih, setTarih] = useState("");
  const [vardiya, setVardiya] = useState("SABAH");

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/nobet-cizelgesi/", {
        personel_id: Number(personelId),
        departman_id: Number(departmanId),
        tarih,
        vardiya,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nobetler"] });
      setPersonelId("");
      setTarih("");
    },
  });

  return (
    <AppShell
      title="Nöbet Çizelgesi"
      links={canCreate ? [{ to: "/admin", label: "Admin" }] : []}
    >
      {canCreate && (
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
            {personeller.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} {p.sicil_no} ({p.unvan})
              </option>
            ))}
          </select>
          <select
            className="rounded border px-3 py-2"
            value={departmanId}
            onChange={(e) => setDepartmanId(e.target.value)}
            required
          >
            <option value="">Departman</option>
            {departmanlar.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ad}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded border px-3 py-2"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            required
          />
          <select
            className="rounded border px-3 py-2"
            value={vardiya}
            onChange={(e) => setVardiya(e.target.value)}
          >
            <option value="SABAH">Sabah</option>
            <option value="AKSAM">Akşam</option>
            <option value="GECE">Gece</option>
          </select>
          <Button type="submit">Nöbet ekle</Button>
        </form>
      )}
      <ul className="space-y-2">
        {nobetler.map((n) => (
          <li key={n.id} className="rounded border bg-card px-3 py-2 text-sm">
            #{n.id} — personel {n.personel_id} — {n.tarih} — {n.vardiya} — dep{" "}
            {n.departman_id}
          </li>
        ))}
        {nobetler.length === 0 && (
          <p className="text-sm text-muted-foreground">Nöbet kaydı yok.</p>
        )}
      </ul>
    </AppShell>
  );
}
