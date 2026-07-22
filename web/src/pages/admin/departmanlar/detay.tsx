import { useEffect, useId, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Users, X } from "lucide-react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import type { Personel } from "@/entities/personel";

type Birim = { id: number; ad: string; kod: string | null; sira: number };
type Departman = {
  id: number;
  ad: string;
  birim_id: number | null;
  birim_ad: string | null;
  kategori: string | null;
  aciklama: string | null;
  kat_no: number | null;
};

/** Liste üzerinde popup; kapanınca parent state (açık birim) korunur. */
export function DepartmanDetayPage() {
  const { departmanId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const id = Number(departmanId);
  const roleRoot =
    "/" + (location.pathname.split("/").filter(Boolean)[0] ?? "admin");
  const listPath = `${roleRoot}/departmanlar`;

  const close = () => navigate(listPath);

  const [editing, setEditing] = useState(false);
  const [editAd, setEditAd] = useState("");
  const [editBirimId, setEditBirimId] = useState("");
  const [editKatNo, setEditKatNo] = useState("");
  const [editAciklama, setEditAciklama] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const editTitleId = useId();
  const panelTitleId = useId();

  const {
    data: departmanlar = [],
    isLoading: depLoading,
    isError: depError,
    error: depErr,
  } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const { data: birimler = [] } = useQuery({
    queryKey: ["birimler"],
    queryFn: async () =>
      (await api.get<Birim[]>("/departmanlar/birimler")).data,
  });

  const {
    data: personeller = [],
    isLoading: perLoading,
    isError: perError,
    error: perErr,
  } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  const departman = useMemo(
    () => departmanlar.find((d) => d.id === id),
    [departmanlar, id],
  );

  const gorevliler = useMemo(
    () => personeller.filter((p) => p.departman_id === id),
    [personeller, id],
  );

  const sortedBirimler = useMemo(
    () => [...birimler].sort((a, b) => a.sira - b.sira),
    [birimler],
  );

  const isLoading = depLoading || perLoading;
  const isError = depError || perError;
  const error = depErr ?? perErr;

  const openEdit = () => {
    if (!departman) return;
    setEditAd(departman.ad);
    setEditBirimId(
      departman.birim_id != null ? String(departman.birim_id) : "",
    );
    setEditKatNo(departman.kat_no != null ? String(departman.kat_no) : "");
    setEditAciklama(departman.aciklama ?? "");
    setActionError(null);
    setEditing(true);
  };

  const updateMut = useMutation({
    mutationFn: async () => {
      const kat = editKatNo.trim();
      return api.patch(`/departmanlar/${id}`, {
        ad: editAd.trim(),
        birim_id: editBirimId ? Number(editBirimId) : null,
        kat_no: kat === "" ? null : Number(kat),
        aciklama: editAciklama.trim() || null,
      });
    },
    onSuccess: () => {
      setActionError(null);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["departmanlar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editing) setEditing(false);
      else navigate(listPath);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, listPath, navigate]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={panelTitleId}
        className="relative z-10 flex max-h-[min(90vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={panelTitleId} className="truncate text-lg font-semibold">
              {departman?.ad ?? "Departman"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {departman?.birim_ad
                ? `${departman.birim_ad} birimi`
                : "Departman detayı"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {departman && (
              <Button type="button" size="sm" variant="outline" onClick={openEdit}>
                Düzenle
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Kapat"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p>Yükleniyor…</p>
          ) : isError ? (
            <p className="text-sm text-red-600" role="alert">
              {getApiErrorMessage(error)}
            </p>
          ) : !departman ? (
            <p className="text-sm text-muted-foreground">Departman bulunamadı.</p>
          ) : (
            <div className="space-y-5">
              <section className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "var(--panel-inset-bg)",
                      color: "var(--nav-active-bg)",
                    }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{departman.ad}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {departman.birim_ad
                        ? `${departman.birim_ad} birimi`
                        : "Birim atanmamış"}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Birim</dt>
                    <dd className="font-medium">{departman.birim_ad ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Kategori</dt>
                    <dd className="font-medium">{departman.kategori ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Kat</dt>
                    <dd className="font-medium">
                      {departman.kat_no != null ? departman.kat_no : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Personel sayısı</dt>
                    <dd className="font-medium">{gorevliler.length}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Açıklama</dt>
                    <dd className="mt-0.5 font-medium">
                      {departman.aciklama?.trim()
                        ? departman.aciklama
                        : "Bu departman için açıklama girilmemiş."}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users
                    className="h-4 w-4"
                    style={{ color: "var(--nav-active-bg)" }}
                  />
                  <h3 className="text-base font-semibold">
                    Görevli personel ({gorevliler.length})
                  </h3>
                </div>

                {gorevliler.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bu departmanda kayıtlı personel yok.
                  </p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">Sicil</th>
                        <th>Ad Soyad</th>
                        <th>Rol</th>
                        <th>Unvan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gorevliler.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="py-2">{p.sicil_no}</td>
                          <td>
                            {p.ad || p.soyad
                              ? `${p.ad ?? ""} ${p.soyad ?? ""}`.trim()
                              : `Kullanıcı #${p.kullanici_id}`}
                          </td>
                          <td>{p.rol ?? "—"}</td>
                          <td>{p.unvan ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {editing && departman && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditing(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={editTitleId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg"
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
                  <option value="">—</option>
                  {sortedBirimler.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ad}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Kat</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-border px-3 py-2"
                  value={editKatNo}
                  onChange={(e) => setEditKatNo(e.target.value)}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Açıklama</span>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-border px-3 py-2"
                  value={editAciklama}
                  onChange={(e) => setEditAciklama(e.target.value)}
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
                  onClick={() => setEditing(false)}
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
    </div>
  );
}
