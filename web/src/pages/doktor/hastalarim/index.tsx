import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  getApiErrorMessage,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import {
  DoktorHastaSecimField,
  useDoktorHastaListeFiltresi,
} from "@/features/doktor-hasta-secim";

type Hasta = {
  id: string;
  tc_kimlik_no: string;
  ad?: string | null;
  soyad?: string | null;
  kan_grubu?: string | null;
};

function maskTc(tc: string) {
  if (tc.length < 5) return tc;
  return `${tc.slice(0, 3)}****${tc.slice(-2)}`;
}

export function DoktorHastalarimPage() {
  const filtre = useDoktorHastaListeFiltresi();
  const {
    data: hastalar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Hasta>>("/hastalar/benim", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const filtered = useMemo(
    () => hastalar.filter((h) => filtre.matchHastaId(h.id)),
    [hastalar, filtre.matchHastaId],
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Hastalarım</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Randevu, muayene, tetkik veya konsültasyon kapsamında erişebildiğiniz
          hastalar
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-border bg-card p-4">
        <DoktorHastaSecimField
          mode="filtre"
          hastaModu={filtre.hastaModu}
          onModuChange={filtre.switchModu}
          hastaTarih={filtre.hastaTarih}
          onTarihChange={filtre.changeTarih}
          options={filtre.hastaSecenekleri}
          value={filtre.hastaId}
          onChange={filtre.setHastaId}
        />
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hasta bulunamadı.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Ad Soyad</th>
              <th>TC</th>
              <th>Kan grubu</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="py-2">
                  {`${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`}
                </td>
                <td>{maskTc(h.tc_kimlik_no)}</td>
                <td>{h.kan_grubu ?? "—"}</td>
                <td>
                  <Link className="underline" to={`/doktor/muayene`}>
                    Muayene
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
