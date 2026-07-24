import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, ListPager } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  getApiErrorMessage,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import type { Hasta } from "@/entities/hasta";

type Kullanici = {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string | null;
  aktif_mi?: boolean;
};

const PAGE_SIZE = 50;

export function AdminHastalarPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hastalar", page],
    queryFn: async () =>
      (
        await api.get<PageResponse<Hasta>>("/hastalar/", {
          params: { page, page_size: PAGE_SIZE },
        })
      ).data,
  });
  const hastalar = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);

  const { data: kullanicilar = [] } = useQuery({
    queryKey: ["kullanicilar", "lookup"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Kullanici>>("/kullanicilar/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const kullaniciById = useMemo(() => {
    const map = new Map<number, Kullanici>();
    for (const k of kullanicilar) map.set(k.id, k);
    return map;
  }, [kullanicilar]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return hastalar
      .map((h) => {
        const k = kullaniciById.get(h.kullanici_id);
        return {
          ...h,
          ad: k?.ad ?? "—",
          soyad: k?.soyad ?? "—",
          email: k?.email ?? "—",
          telefon: k?.telefon ?? "—",
          aktif_mi: k?.aktif_mi,
        };
      })
      .filter((r) => {
        if (!needle) return true;
        return (
          r.tc_kimlik_no.includes(needle) ||
          r.ad.toLowerCase().includes(needle) ||
          r.soyad.toLowerCase().includes(needle) ||
          r.email.toLowerCase().includes(needle)
        );
      });
  }, [hastalar, kullaniciById, q]);

  return (
    <AppShell title="Hastalar" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Kayıtlı hasta bilgileri (yalnızca görüntüleme).
      </p>
      <div className="mb-4">
        <input
          className="w-full max-w-md rounded-md border border-border px-3 py-2 text-sm"
          placeholder="TC, ad, soyad veya e-posta ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hasta kaydı yok.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">TC</th>
                  <th className="pr-3">Ad Soyad</th>
                  <th className="pr-3">E-posta</th>
                  <th className="pr-3">Telefon</th>
                  <th className="pr-3">Doğum</th>
                  <th className="pr-3">Cinsiyet</th>
                  <th className="pr-3">Kan grubu</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-3 font-mono text-xs">{r.tc_kimlik_no}</td>
                    <td className="pr-3">
                      {r.ad} {r.soyad}
                    </td>
                    <td className="pr-3">{r.email}</td>
                    <td className="pr-3">{r.telefon ?? "—"}</td>
                    <td className="pr-3">
                      {r.dogum_tarihi
                        ? new Date(r.dogum_tarihi).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                    <td className="pr-3">{r.cinsiyet ?? "—"}</td>
                    <td className="pr-3">{r.kan_grubu ?? "—"}</td>
                    <td>
                      {r.aktif_mi === false ? (
                        <span className="text-muted-foreground">Pasif</span>
                      ) : (
                        "Aktif"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </AppShell>
  );
}
