import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Button, SearchableCombobox } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { PersonelEkleForm } from "@/features/personel-ekle";
import { PersonelImportPanel } from "@/features/personel-import";
import type { Personel } from "@/entities/personel";

type Departman = { id: number; ad: string; birim_ad?: string | null };

export function PersonelYonetimiPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Personel | null>(null);
  const [editDepartmanId, setEditDepartmanId] = useState("");
  const [editUnvan, setEditUnvan] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const titleId = useId();

  const {
    data: personeller = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const departmanOptions = useMemo(
    () =>
      departmanlar.map((d) => {
        const label = d.birim_ad ? `${d.birim_ad} · ${d.ad}` : d.ad;
        return {
          value: String(d.id),
          label,
          searchText: `${d.ad} ${d.birim_ad ?? ""}`,
        };
      }),
    [departmanlar],
  );

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return api.patch(`/personel/${editing.id}`, {
        departman_id: editDepartmanId ? Number(editDepartmanId) : null,
        unvan: editUnvan || null,
      });
    },
    onSuccess: () => {
      setActionError(null);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["personel"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const openEdit = (p: Personel) => {
    setEditing(p);
    setEditDepartmanId(p.departman_id != null ? String(p.departman_id) : "");
    setEditUnvan(p.unvan ?? "");
    setActionError(null);
  };

  const adSoyad = editing
    ? editing.ad || editing.soyad
      ? `${editing.ad ?? ""} ${editing.soyad ?? ""}`.trim()
      : `Sicil ${editing.sicil_no}`
    : "";

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

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : personeller.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz personel yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Sicil</th>
              <th>Ad Soyad</th>
              <th>Rol</th>
              <th>Departman</th>
              <th>Unvan</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {personeller.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.sicil_no}</td>
                <td>
                  {p.ad || p.soyad
                    ? `${p.ad ?? ""} ${p.soyad ?? ""}`.trim()
                    : `Kullanıcı #${p.kullanici_id}`}
                </td>
                <td>{p.rol ?? "—"}</td>
                <td>{p.departman_ad ?? "—"}</td>
                <td>{p.unvan ?? "—"}</td>
                <td className="py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(p)}
                  >
                    Düzenle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Hesap listesi için{" "}
        <Link className="underline" to="/admin/kullanicilar">
          Kullanıcılar
        </Link> 
        sayfasına bakın.
      </p>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditing(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
          >
            <h2 id={titleId} className="text-lg font-semibold">
              Personel düzenle
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {adSoyad} · {editing.sicil_no}
              {editing.rol ? ` · ${editing.rol}` : ""}
            </p>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateMut.mutate();
              }}
            >
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Departman</span>
                <SearchableCombobox
                  options={departmanOptions}
                  value={editDepartmanId}
                  onChange={setEditDepartmanId}
                  placeholder={"Departman ara ve seç…"}
                  emptyLabel="Eşleşen departman yok"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Unvan</span>
                <input
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={editUnvan}
                  onChange={(e) => setEditUnvan(e.target.value)}
                  placeholder="Örn. Uzman Hemşire"
                />
              </label>

              {actionError && (
                <p className="text-sm text-red-600" role="alert">
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Vazgeç
                </Button>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending ? "Kaydediliyor…" : "Kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
