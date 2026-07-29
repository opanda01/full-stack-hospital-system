import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, ListPager } from "@/shared/ui";
import {
  fetchAllPages,
  getApiErrorMessage,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import type { Hasta } from "@/entities/hasta";

const PAGE_SIZE = 50;

function displayName(h: Hasta): string {
  const ad = `${h.ad ?? ""} ${h.soyad ?? ""}`.trim();
  return ad || "—";
}

export function AdminHastalarPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: hastalar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hastalar"],
    queryFn: () => fetchAllPages<Hasta>("/hastalar/"),
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return hastalar;
    return hastalar.filter((h) => {
      const haystack = [
        h.tc_kimlik_no,
        h.ad ?? "",
        h.soyad ?? "",
        h.email ?? "",
        h.telefon ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [hastalar, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

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
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hasta kaydı yok.</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            {filtered.length} hasta
          </p>
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
                {paged.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-3 font-mono text-xs">
                      {r.tc_kimlik_no}
                    </td>
                    <td className="pr-3">{displayName(r)}</td>
                    <td className="pr-3">{r.email?.trim() || "—"}</td>
                    <td className="pr-3">{r.telefon?.trim() || "—"}</td>
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
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </AppShell>
  );
}
