import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppShell, Button, Input, SearchableCombobox } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { PersonelEkleForm } from "@/features/personel-ekle";
import { PersonelImportPanel } from "@/features/personel-import";
import type { Personel } from "@/entities/personel";

type Departman = { id: number; ad: string; birim_ad?: string | null };

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
];

type DurumFiltre = "hepsi" | "aktif" | "pasif";

function normalize(s: string) {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export function PersonelYonetimiPage() {
  const location = useLocation();
  const roleRoot = roleRootFromPath(location.pathname);
  const isAdmin = roleRoot === "/admin";
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Personel | null>(null);
  const [editDepartmanId, setEditDepartmanId] = useState("");
  const [editUnvan, setEditUnvan] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [arama, setArama] = useState("");
  const [rolFiltre, setRolFiltre] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltre>("hepsi");
  const [departmanFiltre, setDepartmanFiltre] = useState("");
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

  const filtered = useMemo(() => {
    const q = normalize(arama);
    return personeller.filter((p) => {
      if (rolFiltre && p.rol !== rolFiltre) return false;
      if (durumFiltre === "aktif" && p.aktif_mi === false) return false;
      if (durumFiltre === "pasif" && p.aktif_mi !== false) return false;
      if (departmanFiltre) {
        if (departmanFiltre === "yok") {
          if (p.departman_id != null) return false;
        } else if (String(p.departman_id) !== departmanFiltre) {
          return false;
        }
      }
      if (!q) return true;
      const haystack = normalize(
        [
          p.sicil_no,
          p.ad ?? "",
          p.soyad ?? "",
          p.email ?? "",
          p.rol ?? "",
          p.unvan ?? "",
          p.departman_ad ?? "",
        ].join(" "),
      );
      return haystack.includes(q);
    });
  }, [personeller, arama, rolFiltre, durumFiltre, departmanFiltre]);

  const filtreAktif =
    Boolean(arama.trim()) ||
    Boolean(rolFiltre) ||
    durumFiltre !== "hepsi" ||
    Boolean(departmanFiltre);

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

  const links = [{ to: roleRoot, label: "Ana" }];
  if (isAdmin) {
    links.push({ to: "/admin/kullanicilar", label: "Kullanıcılar" });
  }

  return (
    <AppShell title="Personel Yönetimi" links={links}>
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
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <label className="min-w-[200px] flex-1 space-y-1 text-sm">
              <span className="text-muted-foreground">Ara</span>
              <Input
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Sicil, ad, e-posta, unvan…"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Rol</span>
              <select
                className="block min-w-[160px] rounded-md border border-border bg-background px-3 py-2"
                value={rolFiltre}
                onChange={(e) => setRolFiltre(e.target.value)}
              >
                <option value="">Tümü</option>
                {ROLLER.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Durum</span>
              <select
                className="block min-w-[120px] rounded-md border border-border bg-background px-3 py-2"
                value={durumFiltre}
                onChange={(e) => setDurumFiltre(e.target.value as DurumFiltre)}
              >
                <option value="hepsi">Tümü</option>
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Departman</span>
              <select
                className="block min-w-[180px] rounded-md border border-border bg-background px-3 py-2"
                value={departmanFiltre}
                onChange={(e) => setDepartmanFiltre(e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="yok">Atanmamış</option>
                {departmanlar.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.birim_ad ? `${d.birim_ad} · ${d.ad}` : d.ad}
                  </option>
                ))}
              </select>
            </label>
            {filtreAktif && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setArama("");
                  setRolFiltre("");
                  setDurumFiltre("hepsi");
                  setDepartmanFiltre("");
                }}
              >
                Temizle
              </Button>
            )}
          </div>

          <p className="mb-2 text-sm text-muted-foreground">
            {filtered.length} / {personeller.length} personel
          </p>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Filtreye uyan personel yok.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Sicil</th>
                  <th>Ad Soyad</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>Departman</th>
                  <th>Unvan</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{p.sicil_no}</td>
                    <td>
                      {p.ad || p.soyad
                        ? `${p.ad ?? ""} ${p.soyad ?? ""}`.trim()
                        : `Kullanıcı #${p.kullanici_id}`}
                    </td>
                    <td>{p.rol ?? "—"}</td>
                    <td>{p.aktif_mi === false ? "Pasif" : "Aktif"}</td>
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
        </>
      )}

      {isAdmin ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Hesap listesi için{" "}
          <Link className="underline" to="/admin/kullanicilar">
            Kullanıcılar
          </Link>{" "}
          sayfasına bakın.
        </p>
      ) : null}

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
                  placeholder="Departman ara ve seç"
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
