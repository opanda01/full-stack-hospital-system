import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button, ListPager } from "@/shared/ui";
import { api } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";
import {
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";

type Sikayet = {
  id: number;
  tur: string;
  icerik: string;
  tarih: string;
  durum: string;
};

const PAGE_SIZE = 50;

export function SikayetOneriPage() {
  const qc = useQueryClient();
  const canListAll = useAuthStore((s) =>
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );
  const [page, setPage] = useState(1);
  const [tur, setTur] = useState("SIKAYET");
  const [icerik, setIcerik] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sikayetler", page],
    queryFn: async () =>
      (
        await api.get<PageResponse<Sikayet>>("/sikayet-oneri/", {
          params: { page, page_size: PAGE_SIZE },
        })
      ).data,
    enabled: canListAll,
  });
  const liste = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);

  const gonder = useMutation({
    mutationFn: async () => api.post("/sikayet-oneri/", { tur, icerik }),
    onSuccess: () => {
      setIcerik("");
      qc.invalidateQueries({ queryKey: ["sikayetler"] });
    },
  });

  return (
    <AppShell title="Şikayet / Öneri">
      {!canListAll && (
        <form
          className="mb-6 max-w-lg space-y-3 rounded border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            gonder.mutate();
          }}
        >
          <select
            className="w-full rounded border px-3 py-2"
            value={tur}
            onChange={(e) => setTur(e.target.value)}
          >
            <option value="SIKAYET">Şikayet</option>
            <option value="ONERI">Öneri</option>
          </select>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={4}
            placeholder="Mesajınız"
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            required
          />
          <Button type="submit" disabled={gonder.isPending}>
            Gönder
          </Button>
          {gonder.isSuccess && (
            <p className="text-sm text-emerald-700">Gönderildi.</p>
          )}
        </form>
      )}

      {canListAll && (
        <section>
          <p className="mb-3 text-sm text-muted-foreground">
            Gelen şikayet ve öneri kayıtları.
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : liste.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kayıt yok.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {liste.map((s) => (
                  <li key={s.id} className="rounded border bg-card p-3 text-sm">
                    <p className="font-medium">
                      #{s.id} {s.tur} — {s.durum}
                    </p>
                    <p className="text-muted-foreground">{s.icerik}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.tarih).toLocaleString("tr-TR")}
                    </p>
                  </li>
                ))}
              </ul>
              <ListPager
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      )}
    </AppShell>
  );
}
