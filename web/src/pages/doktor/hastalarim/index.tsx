import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Hasta = {
  id: number;
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
  const [arama, setArama] = useState("");
  const {
    data: hastalar = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/benim")).data,
  });

  const filtered = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    if (!q) return hastalar;
    return hastalar.filter((h) => {
      const hay = `${h.ad ?? ""} ${h.soyad ?? ""} ${h.tc_kimlik_no}`.toLocaleLowerCase(
        "tr-TR",
      );
      return hay.includes(q);
    });
  }, [hastalar, arama]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Hastalarım</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Randevu, muayene, tetkik veya konsültasyon kapsamında erişebildiğiniz
          hastalar
        </p>
      </div>
      <Input
        className="max-w-sm"
        placeholder="Ad veya TC ara…"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
      />
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
                  <Link
                    className="underline"
                    to={`/doktor/muayene`}
                  >
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
