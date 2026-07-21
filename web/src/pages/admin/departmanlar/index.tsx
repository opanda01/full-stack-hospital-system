import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

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
  const [editId, setEditId] = useState<number | null>(null);
  const [editAd, setEditAd] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/departmanlar/", { ad, kategori, kat_no: null }),
    onSuccess: () => {
      setActionError(null);
      setAd("");
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () =>
      api.patch(`/departmanlar/${editId}`, {
        ad: editAd,
        kategori: editKategori || null,
      }),
    onSuccess: () => {
      setActionError(null);
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/departmanlar/${id}`),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
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
        <Button type="submit" disabled={createMut.isPending}>
          Ekle
        </Button>
      </form>

      {actionError && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-600">Henüz departman yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Ad</th>
              <th>Kategori</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-b align-top">
                {editId === d.id ? (
                  <>
                    <td className="py-2">
                      <input
                        className="rounded border px-2 py-1"
                        value={editAd}
                        onChange={(e) => setEditAd(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="rounded border px-2 py-1"
                        value={editKategori}
                        onChange={(e) => setEditKategori(e.target.value)}
                      />
                    </td>
                    <td className="space-x-2 py-2">
                      <Button
                        type="button"
                        disabled={updateMut.isPending}
                        onClick={() => updateMut.mutate()}
                      >
                        Kaydet
                      </Button>
                      <Button type="button" onClick={() => setEditId(null)}>
                        Vazgeç
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2">{d.ad}</td>
                    <td>{d.kategori}</td>
                    <td className="space-x-2 py-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setEditId(d.id);
                          setEditAd(d.ad);
                          setEditKategori(d.kategori ?? "");
                          setActionError(null);
                        }}
                      >
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${d.ad}" departmanını silmek istiyor musunuz?`,
                            )
                          ) {
                            deleteMut.mutate(d.id);
                          }
                        }}
                      >
                        Sil
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
