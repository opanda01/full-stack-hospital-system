import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppShell, Button, Input, ListPager, SearchableCombobox } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  getApiErrorMessage,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
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
  "RADYOLOG",
  "TEMIZLIK_PERSONELI",
  "GUVENLIK",
  "IDARI_PERSONEL",
];

type DurumFiltre = "hepsi" | "aktif" | "pasif" | "onay_bekliyor";

const PAGE_SIZE = 50;

function erisimEtiket(durum: string | null | undefined): string {
  switch (durum) {
    case "BEKLEMEDE":
      return "Onay bekliyor";
    case "ONAYLANDI":
      return "Onaylandı";
    case "REDDEDILDI":
      return "Reddedildi";
    default:
      return durum ?? "—";
  }
}

function hesapDurumu(p: Personel): string {
  if (p.erisim_durumu === "BEKLEMEDE") return "Onay bekliyor";
  if (p.aktif_mi === false) return "Pasif";
  return "Aktif";
}

export function PersonelYonetimiPage() {
  const location = useLocation();
  const roleRoot = roleRootFromPath(location.pathname);
  const isAdmin = roleRoot === "/admin";
  const isBashekim = roleRoot === "/bashekim";
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Personel | null>(null);
  const [editDepartmanId, setEditDepartmanId] = useState("");
  const [editUnvan, setEditUnvan] = useState("");
  const [editAd, setEditAd] = useState("");
  const [editSoyad, setEditSoyad] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefon, setEditTelefon] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [eklemeMesaji, setEklemeMesaji] = useState<string | null>(null);
  const [arama, setArama] = useState("");
  const [aramaGirdi, setAramaGirdi] = useState("");
  const [rolFiltre, setRolFiltre] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltre>("hepsi");
  const [departmanFiltre, setDepartmanFiltre] = useState("");
  const [page, setPage] = useState(1);
  const titleId = useId();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "personel",
      page,
      rolFiltre,
      durumFiltre,
      departmanFiltre,
      arama,
    ],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: PAGE_SIZE,
      };
      if (rolFiltre) params.rol = rolFiltre;
      if (departmanFiltre === "yok") {
        params.departman_atanmamis = true;
      } else if (departmanFiltre) {
        params.departman_id = Number(departmanFiltre);
      }
      if (durumFiltre === "aktif") params.aktif_mi = true;
      if (durumFiltre === "pasif") params.aktif_mi = false;
      if (durumFiltre === "onay_bekliyor") params.erisim_durumu = "BEKLEMEDE";
      if (arama.trim()) params.arama = arama.trim();
      return (
        await api.get<PageResponse<Personel>>("/personel/", { params })
      ).data;
    },
  });

  const personeller = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);

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

  useEffect(() => {
    setPage(1);
  }, [arama, rolFiltre, durumFiltre, departmanFiltre]);

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
        ad: editAd.trim(),
        soyad: editSoyad.trim(),
        email: editEmail.trim() || null,
        telefon: editTelefon.trim() || null,
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
    setEditAd(p.ad ?? "");
    setEditSoyad(p.soyad ?? "");
    setEditEmail(p.email ?? "");
    setEditTelefon(p.telefon ?? "");
    setActionError(null);
  };

  const links = [{ to: roleRoot, label: "Ana" }];
  if (isAdmin) {
    links.push({ to: "/admin/kullanicilar", label: "Kullanıcılar" });
  }

  return (
    <AppShell title="Personel Yönetimi" links={links}>
      <PersonelImportPanel />
      <PersonelEkleForm
        onSuccess={() => {
          setPage(1);
          setArama("");
          setAramaGirdi("");
          setRolFiltre("");
          setDurumFiltre("hepsi");
          setDepartmanFiltre("");
          setEklemeMesaji(
            "Personel eklendi. Kayıt listede «Onay bekliyor» olarak görünür; giriş için Başhekim erişim onayı gerekir.",
          );
        }}
      />

      {eklemeMesaji && (
        <p className="mb-4 rounded border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          {eklemeMesaji}
          {isBashekim ? (
            <>
              {" "}
              <Link className="font-medium underline" to={`${roleRoot}/erisim-onaylari`}>
                Erişim onayları
              </Link>{" "}
              sayfasından onaylayabilirsiniz.
            </>
          ) : null}
        </p>
      )}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filtreAktif ? "Filtreye uyan personel yok." : "Henüz personel yok."}
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <form
              className="min-w-[200px] flex-1 space-y-1 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                setArama(aramaGirdi);
              }}
            >
              <span className="text-muted-foreground">Ara</span>
              <div className="flex gap-2">
                <Input
                  value={aramaGirdi}
                  onChange={(e) => setAramaGirdi(e.target.value)}
                  placeholder="Sicil, ad, e-posta, unvan…"
                />
                <Button type="submit" variant="outline" size="sm">
                  Ara
                </Button>
              </div>
            </form>
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
                className="block min-w-[140px] rounded-md border border-border bg-background px-3 py-2"
                value={durumFiltre}
                onChange={(e) => setDurumFiltre(e.target.value as DurumFiltre)}
              >
                <option value="hepsi">Tümü</option>
                <option value="aktif">Aktif</option>
                <option value="onay_bekliyor">Onay bekliyor</option>
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
                  setAramaGirdi("");
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
            {total} personel
            {durumFiltre === "aktif" ? (
              <span className="ml-1">
                (onay bekleyenler «Onay bekliyor» filtresinde)
              </span>
            ) : null}
          </p>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Sicil</th>
                <th>Ad Soyad</th>
                <th>Rol</th>
                <th>Durum</th>
                <th>Erişim</th>
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
                  <td>{hesapDurumu(p)}</td>
                  <td>{erisimEtiket(p.erisim_durumu)}</td>
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
          <ListPager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
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
            className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg"
          >
            <h2 id={titleId} className="text-lg font-semibold">
              Personel düzenle
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sicil {editing.sicil_no}
              {editing.rol ? ` · ${editing.rol}` : ""}
            </p>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editAd.trim() || !editSoyad.trim()) {
                  setActionError("Ad ve soyad zorunludur");
                  return;
                }
                updateMut.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Ad</span>
                  <Input
                    value={editAd}
                    onChange={(e) => setEditAd(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Soyad</span>
                  <Input
                    value={editSoyad}
                    onChange={(e) => setEditSoyad(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">E-posta</span>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Telefon</span>
                <Input
                  type="tel"
                  value={editTelefon}
                  onChange={(e) => setEditTelefon(e.target.value)}
                  autoComplete="tel"
                  placeholder="05XX XXX XX XX"
                />
              </label>

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
                <Input
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
