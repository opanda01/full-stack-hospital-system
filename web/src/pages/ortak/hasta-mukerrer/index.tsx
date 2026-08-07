import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  fetchAllPages,
  gecerliTcKimlikNo,
  getApiErrorMessage,
  TC_GECERSIZ_MESAJ,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import type { Hasta } from "@/entities/hasta";
import { useAuthStore } from "@/shared/auth";

type MukerrerIstek = {
  id: number;
  kaynak_hasta_id: string;
  hedef_hasta_id: string;
  durum: string;
  gerekce: string;
};

export function HastaMukerrerPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const isAdmin = useAuthStore((s) =>
    s.hasRole("ADMIN", "BASHEKIM"),
  );

  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar"],
    queryFn: () => fetchAllPages<Hasta>("/hastalar/"),
  });

  const [tc, setTc] = useState("");
  const [kaynakId, setKaynakId] = useState("");
  const [hedefId, setHedefId] = useState("");
  const [gerekce, setGerekce] = useState("");
  const [istekId, setIstekId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const adaylar = useQuery({
    queryKey: ["mukerrer-adaylar", tc],
    enabled: gecerliTcKimlikNo(tc),
    queryFn: async () =>
      (
        await api.get<Hasta[]>(
          `/hastalar/mukerrer-adaylar?tc=${encodeURIComponent(tc)}`,
        )
      ).data,
  });

  const istekOlustur = useMutation({
    mutationFn: async () =>
      (
        await api.post<MukerrerIstek>("/hastalar/mukerrer-istekleri", {
        kaynak_hasta_id: kaynakId,
        hedef_hasta_id: hedefId,
        gerekce,
      })
      ).data,
    onSuccess: (row) => {
      setMsg(`İstek oluşturuldu (#${row.id})`);
      setIstekId(String(row.id));
    },
    onError: (e) => setMsg(getApiErrorMessage(e)),
  });

  const onayla = useMutation({
    mutationFn: async () =>
      (
        await api.post<MukerrerIstek>(
        `/hastalar/mukerrer-istekleri/${istekId}/onayla`,
      )
      ).data,
    onSuccess: () => setMsg("Birleştirme onaylandı"),
    onError: (e) => setMsg(getApiErrorMessage(e)),
  });

  function hastaLabel(id: string) {
    const h = hastalar.find((x) => x.id === id);
    if (!h) return id;
    return `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || h.tc_kimlik_no;
  }

  return (
    <AppShell title="Mükerrer hasta (MPI)" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Aynı TC ile olası mükerrer kayıtları listeleyin; birleştirme isteği oluşturun.
        Onay yalnızca başhekim/yönetici.
      </p>

      <section className="mb-8 max-w-xl space-y-3 rounded-xl border border-border p-4">
        <h2 className="font-medium">Aday ara</h2>
        <label className="block text-sm">
          TC kimlik no
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            value={tc}
            onChange={(e) => setTc(e.target.value)}
            placeholder="11 haneli TC"
          />
        </label>
        {!gecerliTcKimlikNo(tc) && tc.length > 0 && (
          <p className="text-sm text-red-600">{TC_GECERSIZ_MESAJ}</p>
        )}
        {adaylar.isFetching && <p className="text-sm">Aranıyor…</p>}
        {adaylar.data && (
          <ul className="list-inside list-disc text-sm">
            {adaylar.data.map((h) => (
              <li key={h.id}>
                {h.ad} {h.soyad} — {h.tc_kimlik_no} ({h.id.slice(0, 8)}…)
              </li>
            ))}
            {adaylar.data.length === 0 && <li>Eşleşen aday yok</li>}
          </ul>
        )}
      </section>

      <form
        className="mb-8 grid max-w-xl gap-3 rounded-xl border border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          istekOlustur.mutate();
        }}
      >
        <h2 className="font-medium">Birleştirme isteği</h2>
        <label className="text-sm">
          Kaynak hasta (silinecek / birleştirilecek)
          <select
            className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            value={kaynakId}
            onChange={(e) => setKaynakId(e.target.value)}
            required
          >
            <option value="">Seçin…</option>
            {hastalar.map((h) => (
              <option key={h.id} value={h.id}>
                {h.ad} {h.soyad} — {h.tc_kimlik_no}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Hedef hasta (kalacak kayıt)
          <select
            className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            value={hedefId}
            onChange={(e) => setHedefId(e.target.value)}
            required
          >
            <option value="">Seçin…</option>
            {hastalar.map((h) => (
              <option key={h.id} value={h.id}>
                {hastaLabel(h.id)} — {h.tc_kimlik_no}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Gerekçe
          <textarea
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            rows={2}
            value={gerekce}
            onChange={(e) => setGerekce(e.target.value)}
            required
          />
        </label>
        <Button type="submit" disabled={istekOlustur.isPending}>
          İstek oluştur
        </Button>
      </form>

      {isAdmin && (
        <section className="max-w-xl space-y-3 rounded-xl border border-border p-4">
          <h2 className="font-medium">İstek onayı</h2>
          <label className="text-sm">
            İstek ID
            <input
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={istekId}
              onChange={(e) => setIstekId(e.target.value)}
            />
          </label>
          <Button
            type="button"
            disabled={!istekId || onayla.isPending}
            onClick={() => onayla.mutate()}
          >
            Onayla
          </Button>
        </section>
      )}

      {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}
    </AppShell>
  );
}
