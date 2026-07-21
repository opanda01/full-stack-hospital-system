import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, ChevronDown } from "lucide-react";
import { AppShell, Button, ConfirmDialog } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

type Birim = { id: number; ad: string; kod: string | null; sira: number };
type Departman = {
  id: number;
  ad: string;
  birim_id: number | null;
  birim_ad: string | null;
  kategori: string | null;
  kat_no: number | null;
};

export function DepartmanYonetimiPage() {
  const qc = useQueryClient();
  const location = useLocation();
  const basePath = location.pathname.replace(/\/$/, "");
  const roleRoot =
    "/" + (location.pathname.split("/").filter(Boolean)[0] ?? "admin");
  const [ad, setAd] = useState("");
  const [birimId, setBirimId] = useState("");
  const [openBirimId, setOpenBirimId] = useState<number | "birimsiz" | null>(
    null,
  );
  const [editing, setEditing] = useState<Departman | null>(null);
  const [editAd, setEditAd] = useState("");
  const [editBirimId, setEditBirimId] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Departman | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const editTitleId = useId();

  const { data: birimler = [] } = useQuery({
    queryKey: ["birimler"],
    queryFn: async () =>
      (await api.get<Birim[]>("/departmanlar/birimler")).data,
  });

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const byBirimId = useMemo(() => {
    const map = new Map<number | "birimsiz", Departman[]>();
    for (const b of birimler) map.set(b.id, []);
    map.set("birimsiz", []);
    for (const d of data) {
      const key = d.birim_id ?? "birimsiz";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [data, birimler]);

  const sortedBirimler = useMemo(
    () => [...birimler].sort((a, b) => a.sira - b.sira),
    [birimler],
  );

  const openDepartmanlar =
    openBirimId == null ? [] : (byBirimId.get(openBirimId) ?? []);

  const openBirimAd =
    openBirimId === "birimsiz"
      ? "Birimsiz"
      : sortedBirimler.find((b) => b.id === openBirimId)?.ad;

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/departmanlar/", {
        ad,
        birim_id: birimId ? Number(birimId) : null,
        kat_no: null,
      }),
    onSuccess: () => {
      setActionError(null);
      setAd("");
      if (birimId) setOpenBirimId(Number(birimId));
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return api.patch(`/departmanlar/${editing.id}`, {
        ad: editAd,
        birim_id: editBirimId ? Number(editBirimId) : null,
      });
    },
    onSuccess: () => {
      setActionError(null);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/departmanlar/${id}`),
    onSuccess: () => {
      setActionError(null);
      setPendingDelete(null);
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
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

  const openEdit = (d: Departman) => {
    setEditing(d);
    setEditAd(d.ad);
    setEditBirimId(d.birim_id != null ? String(d.birim_id) : "");
    setActionError(null);
  };

  const birimsizCount = byBirimId.get("birimsiz")?.length ?? 0;

  return (
    <AppShell
      title="Departman Yönetimi"
      links={[{ to: roleRoot, label: "Ana" }]}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Önce birime tıklayın; altındaki departmanlar açılır. Departman adına
        tıklayınca personel ve kısa bilgilere gidersiniz.
      </p>

      <form
        className="mb-6 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <select
          className="rounded-md border border-border px-3 py-2"
          value={birimId}
          onChange={(e) => setBirimId(e.target.value)}
          required
        >
          <option value="">Birim seç</option>
          {sortedBirimler.map((b) => (
            <option key={b.id} value={b.id}>
              {b.ad}
            </option>
          ))}
        </select>
        <input
          className="min-w-[200px] flex-1 rounded-md border border-border px-3 py-2"
          placeholder="Departman / poliklinik adı"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          required
        />
        <Button type="submit" disabled={createMut.isPending}>
          Ekle
        </Button>
      </form>

      {actionError && !editing && (
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
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedBirimler.map((b) => {
              const count = byBirimId.get(b.id)?.length ?? 0;
              const open = openBirimId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setOpenBirimId(open ? null : b.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    "bg-card hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    open
                      ? "border-[var(--border-accent)] ring-1 ring-[var(--border-accent)]"
                      : "border-border",
                  )}
                  style={{ outlineColor: "var(--border-accent)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: "var(--panel-inset-bg)",
                          color: "var(--nav-active-bg)",
                        }}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{b.ad}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {count} departman
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </button>
              );
            })}

            {birimsizCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setOpenBirimId(openBirimId === "birimsiz" ? null : "birimsiz")
                }
                className={cn(
                  "rounded-xl border p-4 text-left transition bg-card",
                  openBirimId === "birimsiz"
                    ? "border-[var(--border-accent)] ring-1 ring-[var(--border-accent)]"
                    : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Birimsiz</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {birimsizCount} departman
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-1 h-4 w-4 text-muted-foreground transition",
                      openBirimId === "birimsiz" && "rotate-180",
                    )}
                  />
                </div>
              </button>
            )}
          </div>

          {openBirimId != null && (
            <section className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">
                  {openBirimAd} - departmanlar
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenBirimId(null)}
                >
                  Kapat
                </Button>
              </div>

              {openDepartmanlar.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu birimde henüz departman yok.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {openDepartmanlar.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <Link
                        to={`${basePath}/${d.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--nav-active-bg)" }}
                      >
                        {d.ad}
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(d)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={deleteMut.isPending}
                          onClick={() => setPendingDelete(d)}
                        >
                          Sil
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {data.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Henüz departman yok.
            </p>
          )}
        </>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditing(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={editTitleId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <h2 id={editTitleId} className="text-lg font-semibold">
              Departman düzenle
            </h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateMut.mutate();
              }}
            >
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Ad</span>
                <input
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={editAd}
                  onChange={(e) => setEditAd(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Birim</span>
                <select
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={editBirimId}
                  onChange={(e) => setEditBirimId(e.target.value)}
                >
                  <option value="">-</option>
                  {sortedBirimler.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ad}
                    </option>
                  ))}
                </select>
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

      <ConfirmDialog
        open={pendingDelete != null}
        title="Departmanı sil"
        description={
          pendingDelete
            ? `"${pendingDelete.ad}" departmanını silmek istediğinize emin misiniz?`
            : ""
        }
        confirmLabel="Sil"
        destructive
        pending={deleteMut.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMut.mutate(pendingDelete.id);
        }}
      />
    </AppShell>
  );
}
