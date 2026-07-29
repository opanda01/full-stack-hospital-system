import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, Badge, ListPager } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  formatIstanbulDateTime,
  getApiErrorMessage,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { durumToBadgeVariant } from "@/shared/lib/status-badge";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Tetkik = {
  id: string;
  tetkik_turu: string;
  durum: string;
  hasta_id: string;
  hasta_ad_soyad?: string | null;
  istek_yapan_doktor_id: number;
  istek_yapan_doktor_ad_soyad?: string | null;
  created_at?: string | null;
};

const PAGE_SIZE = 50;

export function AdminTetkiklerPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tetkikler", page],
    queryFn: async () =>
      (
        await api.get<PageResponse<Tetkik>>("/tetkikler/", {
          params: { page, page_size: PAGE_SIZE },
        })
      ).data,
  });
  const items = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);

  return (
    <AppShell title="Tetkik özeti" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Sistem genelinde tetkik isteklerinin özet listesi.
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tetkik kaydı yok.</p>
      ) : (
        <>
          <table className="data-table w-full border-collapse text-sm">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tetkik türü</th>
                <th>Durum</th>
                <th>Hasta</th>
                <th>İsteyen doktor</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {t.created_at
                      ? formatIstanbulDateTime(t.created_at)
                      : "—"}
                  </td>
                  <td className="font-medium">{t.tetkik_turu}</td>
                  <td>
                    <Badge variant={durumToBadgeVariant(t.durum)}>
                      {t.durum}
                    </Badge>
                  </td>
                  <td>
                    <span className="font-medium">
                      {t.hasta_ad_soyad ?? "—"}
                    </span>
                  </td>
                  <td>
                    {t.istek_yapan_doktor_ad_soyad ??
                      (t.istek_yapan_doktor_id
                        ? `#${t.istek_yapan_doktor_id}`
                        : "—")}
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
    </AppShell>
  );
}
