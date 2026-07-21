import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import type { Doktor } from "@/entities/doktor";
import type { Personel } from "@/entities/personel";

type Kullanici = {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  rol: string;
};

export function AdminDoktorlarPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    personel_id: "",
    uzmanlik_alani: "",
    diploma_no: "",
    online_randevu_acik_mi: true,
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    uzmanlik_alani: "",
    diploma_no: "",
    online_randevu_acik_mi: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: doktorlar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

  const { data: personeller = [] } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  const { data: kullanicilar = [] } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });

  const kullaniciById = useMemo(() => {
    const map = new Map<number, Kullanici>();
    for (const k of kullanicilar) map.set(k.id, k);
    return map;
  }, [kullanicilar]);

  const doktorPersonelIds = useMemo(
    () => new Set(doktorlar.map((d) => d.personel_id)),
    [doktorlar],
  );

  const uygunPersoneller = useMemo(
    () =>
      personeller.filter((p) => {
        if (doktorPersonelIds.has(p.id)) return false;
        const k = kullaniciById.get(p.kullanici_id);
        return !k || k.rol === "DOKTOR";
      }),
    [personeller, doktorPersonelIds, kullaniciById],
  );

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/doktorlar/", {
        personel_id: Number(form.personel_id),
        uzmanlik_alani: form.uzmanlik_alani,
        diploma_no: form.diploma_no,
        online_randevu_acik_mi: form.online_randevu_acik_mi,
      }),
    onSuccess: () => {
      setFormError(null);
      setForm({
        personel_id: "",
        uzmanlik_alani: "",
        diploma_no: "",
        online_randevu_acik_mi: true,
      });
      qc.invalidateQueries({ queryKey: ["doktorlar"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () =>
      api.patch(`/doktorlar/${editId}`, {
        uzmanlik_alani: editForm.uzmanlik_alani,
        diploma_no: editForm.diploma_no,
        online_randevu_acik_mi: editForm.online_randevu_acik_mi,
      }),
    onSuccess: () => {
      setFormError(null);
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["doktorlar"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  return (
    <AppShell title="Doktorlar" links={[{ to: "/admin", label: "Admin" }]}>
      <form
        className="mb-6 grid max-w-2xl gap-2 rounded border bg-white p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <select
          className="rounded border px-3 py-2 sm:col-span-2"
          value={form.personel_id}
          onChange={(e) => setForm({ ...form, personel_id: e.target.value })}
          required
        >
          <option value="">Personel seç (DOKTOR, doktor kaydı yok)</option>
          {uygunPersoneller.map((p) => {
            const k = kullaniciById.get(p.kullanici_id);
            return (
              <option key={p.id} value={p.id}>
                {k ? `${k.ad} ${k.soyad}` : `Kullanıcı #${p.kullanici_id}`} —{" "}
                {p.sicil_no}
              </option>
            );
          })}
        </select>
        <input
          className="rounded border px-3 py-2"
          placeholder="Uzmanlık alanı"
          value={form.uzmanlik_alani}
          onChange={(e) => setForm({ ...form, uzmanlik_alani: e.target.value })}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Diploma no"
          value={form.diploma_no}
          onChange={(e) => setForm({ ...form, diploma_no: e.target.value })}
          required
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.online_randevu_acik_mi}
            onChange={(e) =>
              setForm({ ...form, online_randevu_acik_mi: e.target.checked })
            }
          />
          Online randevu açık
        </label>
        <Button type="submit" disabled={createMut.isPending}>
          Doktor ekle
        </Button>
      </form>

      {formError && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : doktorlar.length === 0 ? (
        <p className="text-sm text-slate-600">Henüz doktor yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Ad</th>
              <th>Sicil</th>
              <th>Uzmanlık</th>
              <th>Departman</th>
              <th>Diploma</th>
              <th>Online</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {doktorlar.map((d) => (
              <tr key={d.id} className="border-b align-top">
                {editId === d.id ? (
                  <>
                    <td className="py-2" colSpan={3}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          className="rounded border px-2 py-1"
                          value={editForm.uzmanlik_alani}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              uzmanlik_alani: e.target.value,
                            })
                          }
                        />
                        <input
                          className="rounded border px-2 py-1"
                          value={editForm.diploma_no}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              diploma_no: e.target.value,
                            })
                          }
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.online_randevu_acik_mi}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                online_randevu_acik_mi: e.target.checked,
                              })
                            }
                          />
                          Online randevu
                        </label>
                      </div>
                    </td>
                    <td>{d.departman_ad ?? "—"}</td>
                    <td />
                    <td />
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
                    <td className="py-2">
                      {d.ad || d.soyad
                        ? `${d.ad ?? ""} ${d.soyad ?? ""}`.trim()
                        : `Personel #${d.personel_id}`}
                    </td>
                    <td>{d.sicil_no ?? "—"}</td>
                    <td>{d.uzmanlik_alani}</td>
                    <td>{d.departman_ad ?? "—"}</td>
                    <td>{d.diploma_no}</td>
                    <td>{d.online_randevu_acik_mi ? "Evet" : "Hayır"}</td>
                    <td className="py-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setEditId(d.id);
                          setEditForm({
                            uzmanlik_alani: d.uzmanlik_alani,
                            diploma_no: d.diploma_no,
                            online_randevu_acik_mi: d.online_randevu_acik_mi,
                          });
                          setFormError(null);
                        }}
                      >
                        Düzenle
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
