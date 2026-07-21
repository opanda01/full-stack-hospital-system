import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Button, ConfirmDialog } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Kullanici = {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  rol: string;
  aktif_mi: boolean;
};

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
  "HASTA",
];

export function KullaniciYonetimiPage() {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeaktif, setPendingDeaktif] = useState<Kullanici | null>(null);
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });

  const patchMut = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: Partial<Kullanici>;
    }) => api.patch(`/kullanicilar/${id}`, body),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ["kullanicilar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  const deactivateMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/kullanicilar/${id}`),
    onSuccess: () => {
      setActionError(null);
      setPendingDeaktif(null);
      qc.invalidateQueries({ queryKey: ["kullanicilar"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  return (
    <AppShell
      title="Kullanıcı Yönetimi"
      links={[{ to: "/admin", label: "Admin" }]}
    >
      <p className="mb-4 rounded border bg-muted px-3 py-2 text-sm text-foreground">
        Yeni çalışan eklemek için{" "}
        <Link className="font-medium underline" to="/admin/personel">
          Personel
        </Link>{" "}
        sayfasını kullanın. Bu sayfa hesap listesi, rol ve deaktif işlemleri
        içindir.
      </p>

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
        <p className="text-sm text-muted-foreground">Henüz kullanıcı yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Ad</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">
                  {u.ad} {u.soyad}
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="rounded border px-2 py-1"
                    value={u.rol}
                    onChange={(e) =>
                      patchMut.mutate({ id: u.id, body: { rol: e.target.value } })
                    }
                  >
                    {ROLLER.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{u.aktif_mi ? "Aktif" : "Pasif"}</td>
                <td>
                  {u.aktif_mi && (
                    <Button
                      type="button"
                      onClick={() => setPendingDeaktif(u)}
                    >
                      Deaktif
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={pendingDeaktif != null}
        title="Hesabı deaktif et"
        description={
          pendingDeaktif
            ? `${pendingDeaktif.ad} ${pendingDeaktif.soyad} hesabını deaktif etmek istediğinize emin misiniz? Hesap silinmez; giriş yapamaz.`
            : ""
        }
        confirmLabel="Deaktif et"
        destructive
        pending={deactivateMut.isPending}
        onCancel={() => setPendingDeaktif(null)}
        onConfirm={() => {
          if (pendingDeaktif) deactivateMut.mutate(pendingDeaktif.id);
        }}
      />
    </AppShell>
  );
}
