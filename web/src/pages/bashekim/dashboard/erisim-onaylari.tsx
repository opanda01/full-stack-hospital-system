import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/shared/auth";

export function BashekimErisimOnaylariPage() {
  const location = useLocation();
  const root = roleRootFromPath(location.pathname);
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.hasRole("ADMIN"));
  const [redId, setRedId] = useState<number | null>(null);
  const [bypassId, setBypassId] = useState<number | null>(null);
  const [gerekce, setGerekce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  type Talep = {
    personel_id: number;
    sicil_no: string;
    ad: string | null;
    soyad: string | null;
    rol: string | null;
    erisim_durumu: string;
    kaynak_tipi: string | null;
    firma_adi: string | null;
  };

  const { data = [], isLoading } = useQuery({
    queryKey: ["erisim-talepleri"],
    queryFn: async () =>
      (await api.get<Talep[]>("/personel/erisim-talepleri")).data,
  });

  const bekleyen = data.filter((t) => t.erisim_durumu === "BEKLEMEDE");

  const onayMut = useMutation({
    mutationFn: (id: number) =>
      api.post(`/personel/erisim-talepleri/${id}/onayla`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["erisim-talepleri"] });
      qc.invalidateQueries({ queryKey: ["bashekim-ozet"] });
    },
    onError: (e) => setFormError(getApiErrorMessage(e)),
  });

  const redMut = useMutation({
    mutationFn: ({ id, gerekce: g }: { id: number; gerekce: string }) =>
      api.post(`/personel/erisim-talepleri/${id}/reddet`, { gerekce: g }),
    onSuccess: () => {
      setRedId(null);
      setGerekce("");
      qc.invalidateQueries({ queryKey: ["erisim-talepleri"] });
      qc.invalidateQueries({ queryKey: ["bashekim-ozet"] });
    },
    onError: (e) => setFormError(getApiErrorMessage(e)),
  });

  const bypassMut = useMutation({
    mutationFn: ({ id, gerekce: g }: { id: number; gerekce: string }) =>
      api.post(`/personel/erisim-talepleri/${id}/bypass-onayla`, { gerekce: g }),
    onSuccess: () => {
      setBypassId(null);
      setGerekce("");
      qc.invalidateQueries({ queryKey: ["erisim-talepleri"] });
      qc.invalidateQueries({ queryKey: ["bashekim-ozet"] });
    },
    onError: (e) => setFormError(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="page-eyebrow">Personel</p>
        <h2 className="page-title mt-1">Erişim onayları</h2>
        <nav className="mt-2 flex gap-3 text-sm">
          <Link to={`${root}/ozet`} className="text-primary hover:underline">
            Gösterge paneli
          </Link>
          <Link to={`${root}/personel`} className="text-primary hover:underline">
            Personel
          </Link>
        </nav>
      </div>
      <p className="text-sm text-muted-foreground">
        Başhekim onayı olmadan personel sisteme giriş yapamaz. Admin bypass zorunlu
        gerekçe ile denetlenir.
      </p>
      {formError && (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : bekleyen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bekleyen talep yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Sicil</th>
              <th>Ad</th>
              <th>Rol</th>
              <th>Kaynak</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bekleyen.map((t) => (
              <tr key={t.personel_id} className="border-b">
                <td className="py-2">{t.sicil_no}</td>
                <td>
                  {t.ad} {t.soyad}
                </td>
                <td>{t.rol}</td>
                <td>
                  {t.kaynak_tipi}
                  {t.firma_adi ? ` — ${t.firma_adi}` : ""}
                </td>
                <td className="space-x-2 py-2 text-right">
                  <Button
                    size="sm"
                    onClick={() => {
                      setFormError(null);
                      onayMut.mutate(t.personel_id);
                    }}
                  >
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRedId(t.personel_id);
                      setGerekce("");
                    }}
                  >
                    Reddet
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBypassId(t.personel_id);
                        setGerekce("");
                      }}
                    >
                      Bypass
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(redId || bypassId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-lg">
            <h2 className="text-lg font-semibold">
              {bypassId ? "Admin bypass onayı" : "Red gerekçesi"}
            </h2>
            {bypassId && (
              <p className="mt-1 text-sm text-amber-700">
                Bu işlem PERSONEL_ERISIM_ONAY_BYPASS olarak denetlenir.
              </p>
            )}
            <textarea
              className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              value={gerekce}
              onChange={(e) => setGerekce(e.target.value)}
              placeholder="Zorunlu gerekçe"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRedId(null);
                  setBypassId(null);
                }}
              >
                Vazgeç
              </Button>
              <Button
                onClick={() => {
                  setFormError(null);
                  if (bypassId) {
                    bypassMut.mutate({ id: bypassId, gerekce });
                  } else if (redId) {
                    redMut.mutate({ id: redId, gerekce });
                  }
                }}
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
