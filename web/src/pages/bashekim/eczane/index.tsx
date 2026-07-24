import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, ListPager } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  getApiErrorMessage,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Ilac = {
  id: number;
  ad: string;
  stok: number;
  kritik_stok: number;
  kritik_mi: boolean;
};

const PAGE_SIZE = 50;

export function BashekimEczanePage() {
  const root = roleRootFromPath(useLocation().pathname);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["eczane", page],
    queryFn: async () =>
      (
        await api.get<PageResponse<Ilac>>("/eczane/", {
          params: { page, page_size: PAGE_SIZE },
        })
      ).data,
  });
  const items = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);
  return (
    <AppShell title="Eczane" links={[{ to: root, label: "Ana" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">İlaç</th>
                <th>Stok</th>
                <th>Kritik</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="py-2">{i.ad}</td>
                  <td>{i.stok}</td>
                  <td className={i.kritik_mi ? "font-medium text-red-600" : ""}>
                    {i.kritik_mi ? "Evet" : "Hayır"}
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
