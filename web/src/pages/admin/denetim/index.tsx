import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

type Denetim = {
  id: number;
  actor_id: number | null;
  aksiyon: string;
  kaynak: string | null;
  kaynak_id: string | null;
  ip_adresi: string | null;
  zaman: string;
};

export function AdminDenetimPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const [aksiyon, setAksiyon] = useState("");
  const [kaynak, setKaynak] = useState("");

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["denetim"],
    queryFn: async () => (await api.get<Denetim[]>("/denetim/?limit=200")).data,
  });

  const filtered = useMemo(() => {
    const a = aksiyon.trim().toLowerCase();
    const k = kaynak.trim().toLowerCase();
    return data.filter((d) => {
      if (a && !d.aksiyon.toLowerCase().includes(a)) return false;
      if (k && !(d.kaynak ?? "").toLowerCase().includes(k)) return false;
      return true;
    });
  }, [data, aksiyon, kaynak]);

  return (
    <AppShell title="Denetim kayıtları" links={[{ to: root, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Son işlem kayıtları (PHI görüntüleme, erişim onay/bypass dahil).
      </p>
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Aksiyon</span>
          <input
            className="block rounded-md border border-border px-3 py-2"
            placeholder="örn. LOGIN"
            value={aksiyon}
            onChange={(e) => setAksiyon(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Kaynak</span>
          <input
            className="block rounded-md border border-border px-3 py-2"
            placeholder="örn. kullanici"
            value={kaynak}
            onChange={(e) => setKaynak(e.target.value)}
          />
        </label>
      </div>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kayıt yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Zaman</th>
              <th>Aksiyon</th>
              <th>Actor</th>
              <th>Kaynak</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2">
                  {new Date(d.zaman).toLocaleString("tr-TR")}
                </td>
                <td>{d.aksiyon}</td>
                <td>{d.actor_id ?? "—"}</td>
                <td>
                  {d.kaynak ?? "—"}
                  {d.kaynak_id ? ` #${d.kaynak_id}` : ""}
                </td>
                <td>{d.ip_adresi ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
