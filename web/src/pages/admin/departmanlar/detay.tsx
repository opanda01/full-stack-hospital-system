import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users } from "lucide-react";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import type { Personel } from "@/entities/personel";

type Departman = {
  id: number;
  ad: string;
  birim_id: number | null;
  birim_ad: string | null;
  kategori: string | null;
  aciklama: string | null;
  kat_no: number | null;
};

export function DepartmanDetayPage() {
  const { departmanId } = useParams();
  const location = useLocation();
  const id = Number(departmanId);
  const listPath =
    location.pathname.replace(/\/\d+\/?$/, "") || "/admin/departmanlar";
  const roleRoot =
    "/" + (location.pathname.split("/").filter(Boolean)[0] ?? "admin");

  const {
    data: departmanlar = [],
    isLoading: depLoading,
    isError: depError,
    error: depErr,
  } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
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

  const isLoading = depLoading || perLoading;
  const isError = depError || perError;
  const error = depErr ?? perErr;

  return (
    <AppShell
      title={departman?.ad ?? "Departman"}
      links={[
        { to: roleRoot, label: "Ana" },
        { to: listPath, label: "Departmanlar" },
      ]}
    >
      <div className="mb-4">
        <Link
          to={listPath}
          className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent"
        >
          ← Departmanlara dön
        </Link>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : !departman ? (
        <p className="text-sm text-muted-foreground">Departman bulunamadı.</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
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
                <h2 className="text-xl font-semibold">{departman.ad}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {departman.birim_ad
                    ? `${departman.birim_ad} birimi`
                    : "Birim atanmamış"}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
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

          <section className="rounded-xl border border-border bg-card p-5">
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
    </AppShell>
  );
}
