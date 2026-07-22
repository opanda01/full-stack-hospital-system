import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import type { Doktor } from "@/entities/doktor";

export function AdminDoktorlarPage() {
  const location = useLocation();
  const roleRoot = roleRootFromPath(location.pathname);
  const qc = useQueryClient();
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
    <AppShell title="Doktorlar" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 rounded border bg-muted px-3 py-2 text-sm text-foreground">
        Yeni doktor eklemek için{" "}
        <Link className="font-medium underline" to={`${roleRoot}/personel`}>
          Personel
        </Link>{" "}
        sayfasında rol olarak DOKTOR seçin. Bu sayfa liste ve düzenleme içindir.
      </p>

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
        <p className="text-sm text-muted-foreground">Henüz doktor yok.</p>
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
