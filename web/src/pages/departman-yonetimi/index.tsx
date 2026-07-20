import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Departman = {
  id: number;
  ad: string;
  kategori: string | null;
  kat_no: number | null;
};

export function DepartmanYonetimiPage() {
  const qc = useQueryClient();
  const [ad, setAd] = useState("");
  const [kategori, setKategori] = useState("Dahili");
  const { data = [], isLoading } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/departmanlar/", { ad, kategori, kat_no: null }),
    onSuccess: () => {
      setAd("");
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
  });

  return (
    <AppShell title="Departman Yönetimi" links={[{ to: "/admin", label: "Admin" }]}>
      <form
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <input
          className="rounded border px-3 py-2"
          placeholder="Departman adı"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Kategori"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
        />
        <Button type="submit">Ekle</Button>
      </form>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Ad</th>
              <th>Kategori</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2">{d.ad}</td>
                <td>{d.kategori}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
