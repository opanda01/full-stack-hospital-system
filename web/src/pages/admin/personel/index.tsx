import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { PersonelEkleForm } from "@/features/personel-ekle";
import { PersonelImportPanel } from "@/features/personel-import";
import type { Personel } from "@/entities/personel";

type Kullanici = { id: number; ad: string; soyad: string; email: string };
type Departman = { id: number; ad: string };

export function PersonelYonetimiPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [editDepartmanId, setEditDepartmanId] = useState("");
  const [editUnvan, setEditUnvan] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: personeller = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  const { data: kullanicilar = [] } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const kullaniciById = useMemo(() => {
    const map = new Map<number, Kullanici>();
    for (const k of kullanicilar) map.set(k.id, k);
    return map;
  }, [kullanicilar]);

  const departmanById = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of departmanlar) map.set(d.id, d.ad);
    return map;
  }, [departmanlar]);

  const updateMut = useMutation({
    mutationFn: async () =>
      api.patch(`/personel/${editId}`, {
        departman_id: editDepartmanId ? Number(editDepartmanId) : null,
        unvan: editUnvan || null,
      }),
    onSuccess: () => {
      setActionError(null);
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["personel"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  return (
    <AppShell
      title="Personel Yönetimi"
      links={[
        { to: "/admin", label: "Admin" },
        { to: "/admin/kullanicilar", label: "Kullanıcılar" },
      ]}
    >
      <PersonelImportPanel />
      <PersonelEkleForm />

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
      ) : personeller.length === 0 ? (
        <p className="text-sm text-slate-600">Henüz personel yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Sicil</th>
              <th>Ad Soyad</th>
              <th>Departman</th>
              <th>Unvan</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {personeller.map((p) => {
              const k = kullaniciById.get(p.kullanici_id);
              return (
                <tr key={p.id} className="border-b align-top">
                  <td className="py-2">{p.sicil_no}</td>
                  <td>
                    {k ? `${k.ad} ${k.soyad}` : `Kullanıcı #${p.kullanici_id}`}
                  </td>
                  {editId === p.id ? (
                    <>
                      <td>
                        <select
                          className="rounded border px-2 py-1"
                          value={editDepartmanId}
                          onChange={(e) => setEditDepartmanId(e.target.value)}
                        >
                          <option value="">—</option>
                          {departmanlar.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.ad}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="rounded border px-2 py-1"
                          value={editUnvan}
                          onChange={(e) => setEditUnvan(e.target.value)}
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
                      <td>
                        {p.departman_id
                          ? (departmanById.get(p.departman_id) ?? p.departman_id)
                          : "—"}
                      </td>
                      <td>{p.unvan ?? "—"}</td>
                      <td className="py-2">
                        <Button
                          type="button"
                          onClick={() => {
                            setEditId(p.id);
                            setEditDepartmanId(
                              p.departman_id != null ? String(p.departman_id) : "",
                            );
                            setEditUnvan(p.unvan ?? "");
                            setActionError(null);
                          }}
                        >
                          Düzenle
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
