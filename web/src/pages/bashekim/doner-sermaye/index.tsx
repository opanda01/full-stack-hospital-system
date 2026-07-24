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

type Doner = {
  id: number;
  donem: string;
  gelir: string | number;
  gider: string | number;
  net: string | number;
  aciklama: string | null;
};

const PAGE_SIZE = 50;

export function BashekimDonerSermayePage() {
  const root = roleRootFromPath(useLocation().pathname);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["doner", page],
    queryFn: async () =>
      (
        await api.get<PageResponse<Doner>>("/doner-sermaye/", {
          params: { page, page_size: PAGE_SIZE },
        })
      ).data,
  });
  const items = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);
  return (
    <AppShell title="Döner sermaye" links={[{ to: root, label: "Ana" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Dönem</th>
                <th>Gelir</th>
                <th>Gider</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="py-2">{d.donem}</td>
                  <td>{d.gelir}</td>
                  <td>{d.gider}</td>
                  <td>{d.net}</td>
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
