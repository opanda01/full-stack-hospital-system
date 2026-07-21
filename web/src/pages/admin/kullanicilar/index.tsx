import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Kullanici = {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  rol: string;
  aktif_mi: boolean;
};

const ROLLER = [
  "ADMIN",
  "BASHEKIM",
  "MUDUR",
  "DOKTOR",
  "HEMSIRE",
  "EBE",
  "LABORANT",
  "TEMIZLIK_PERSONELI",
  "GUVENLIK",
  "IDARI_PERSONEL",
  "HASTA",
];

export function KullaniciYonetimiPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });

  const [form, setForm] = useState({
    tc_kimlik_no: "",
    ad: "",
    soyad: "",
    email: "",
    sifre: "Test1234!",
    rol: "IDARI_PERSONEL",
  });

  const createMut = useMutation({
    mutationFn: async () => api.post("/kullanicilar/", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kullanicilar"] });
      setForm((f) => ({ ...f, tc_kimlik_no: "", ad: "", soyad: "", email: "" }));
    },
  });

  const patchMut = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: Partial<Kullanici>;
    }) => api.patch(`/kullanicilar/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kullanicilar"] }),
  });

  const deactivateMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/kullanicilar/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kullanicilar"] }),
  });

  return (
    <AppShell
      title="Kullanıcı Yönetimi"
      links={[{ to: "/admin", label: "Admin" }]}
    >
      <form
        className="mb-6 grid max-w-2xl gap-2 rounded border bg-white p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <input
          className="rounded border px-3 py-2"
          placeholder="TC"
          value={form.tc_kimlik_no}
          onChange={(e) => setForm({ ...form, tc_kimlik_no: e.target.value })}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="E-posta"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Ad"
          value={form.ad}
          onChange={(e) => setForm({ ...form, ad: e.target.value })}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Soyad"
          value={form.soyad}
          onChange={(e) => setForm({ ...form, soyad: e.target.value })}
          required
        />
        <select
          className="rounded border px-3 py-2"
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value })}
        >
          {ROLLER.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button type="submit">Kullanıcı ekle</Button>
      </form>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Ad</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">
                  {u.ad} {u.soyad}
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="rounded border px-2 py-1"
                    value={u.rol}
                    onChange={(e) =>
                      patchMut.mutate({ id: u.id, body: { rol: e.target.value } })
                    }
                  >
                    {ROLLER.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{u.aktif_mi ? "Aktif" : "Pasif"}</td>
                <td>
                  {u.aktif_mi && (
                    <Button
                      type="button"
                      onClick={() => deactivateMut.mutate(u.id)}
                    >
                      Deaktif
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
