import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, Button, ListPager } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  getApiErrorMessage,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Kapasite = {
  id: number;
  departman_id: number;
  doktor_id: number | null;
  tarih: string;
  slot_sayisi: number;
  kaynak: string;
  son_senkron: string | null;
};

const PAGE_SIZE = 50;

export function BashekimMhrsPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["mhrs", page],
    queryFn: async () =>
      (
        await api.get<PageResponse<Kapasite>>("/mhrs/", {
          params: { page, page_size: PAGE_SIZE },
        })
      ).data,
  });
  const items = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);
  const senkron = useMutation({
    mutationFn: (id: number) => api.post(`/mhrs/${id}/senkron`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mhrs"] }),
  });

  return (
    <AppShell title="MHRS kapasite" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Branş/hekim randevu kapasitesi (mock MHRS senkron).
      </p>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Tarih</th>
                <th>Departman</th>
                <th>Slot</th>
                <th>Kaynak</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.tarih}</td>
                  <td>#{r.departman_id}</td>
                  <td>{r.slot_sayisi}</td>
                  <td>{r.kaynak}</td>
                  <td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => senkron.mutate(r.id)}
                    >
                      Senkron
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
    </AppShell>
  );
}
