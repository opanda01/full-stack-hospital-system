import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Kullanici = { id: number; ad: string; soyad: string; email: string; rol: string };
type Departman = { id: number; ad: string };

export function PersonelEkleForm({ onSuccess }: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  const [kullaniciId, setKullaniciId] = useState("");
  const [sicil, setSicil] = useState("");
  const [departmanId, setDepartmanId] = useState("");
  const [unvan, setUnvan] = useState("");

  const { data: kullanicilar = [] } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/personel/", {
        kullanici_id: Number(kullaniciId),
        sicil_no: sicil,
        departman_id: departmanId ? Number(departmanId) : null,
        unvan: unvan || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personel"] });
      setKullaniciId("");
      setSicil("");
      setUnvan("");
      onSuccess?.();
    },
  });

  return (
    <form
      className="mb-6 grid max-w-xl gap-2 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        createMut.mutate();
      }}
    >
      <select
        className="rounded border px-3 py-2"
        value={kullaniciId}
        onChange={(e) => setKullaniciId(e.target.value)}
        required
      >
        <option value="">Kullanıcı seç</option>
        {kullanicilar.map((k) => (
          <option key={k.id} value={k.id}>
            {k.ad} {k.soyad} ({k.rol})
          </option>
        ))}
      </select>
      <input
        className="rounded border px-3 py-2"
        placeholder="Sicil no"
        value={sicil}
        onChange={(e) => setSicil(e.target.value)}
        required
      />
      <select
        className="rounded border px-3 py-2"
        value={departmanId}
        onChange={(e) => setDepartmanId(e.target.value)}
      >
        <option value="">Departman (opsiyonel)</option>
        {departmanlar.map((d) => (
          <option key={d.id} value={d.id}>
            {d.ad}
          </option>
        ))}
      </select>
      <input
        className="rounded border px-3 py-2"
        placeholder="Unvan"
        value={unvan}
        onChange={(e) => setUnvan(e.target.value)}
      />
      <Button type="submit">Personel ekle</Button>
    </form>
  );
}
