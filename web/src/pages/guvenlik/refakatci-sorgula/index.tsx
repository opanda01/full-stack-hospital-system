import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { Button, Input } from "@/shared/ui";

type Sonuc = {
  yatis_id: number;
  refakatci_ad_soyad: string;
  yakinlik: string | null;
  servis_adi: string | null;
  yatak_kodu: string | null;
  protokol_no: string;
};

export function GuvenlikRefakatciSorgulaPage() {
  const [q, setQ] = useState("");
  const [aranan, setAranan] = useState("");

  const { data: sonuclar = [], isFetching } = useQuery({
    queryKey: ["guvenlik-refakatci", aranan],
    queryFn: async () =>
      (
        await api.get<Sonuc[]>("/guvenlik/refakatci-sorgula", {
          params: { q: aranan },
        })
      ).data,
    enabled: aranan.length >= 2,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Refakatçi Sorgula
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktif yatış refakatçisi doğrulama (minimum alan)
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAranan(q.trim());
        }}
      >
        <label className="min-w-[240px] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">
            Ad soyad veya protokol no
          </span>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="En az 2 karakter"
          />
        </label>
        <Button type="submit" disabled={q.trim().length < 2 || isFetching}>
          Sorgula
        </Button>
      </form>

      {isFetching ? (
        <p className="text-sm text-muted-foreground">Aranıyor…</p>
      ) : (
        <ul className="space-y-2">
          {sonuclar.map((s) => (
            <li
              key={`${s.yatis_id}-${s.refakatci_ad_soyad}`}
              className="rounded border bg-card p-3 text-sm"
            >
              <div className="font-medium">{s.refakatci_ad_soyad}</div>
              <div className="text-muted-foreground">
                {s.yakinlik ?? "Yakınlık belirtilmemiş"}
                {s.servis_adi ? ` · ${s.servis_adi}` : ""}
                {s.yatak_kodu ? ` · Yatak ${s.yatak_kodu}` : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                Protokol: {s.protokol_no}
              </div>
            </li>
          ))}
          {aranan.length >= 2 && !sonuclar.length && (
            <p className="text-muted-foreground">Sonuç bulunamadı.</p>
          )}
        </ul>
      )}
    </div>
  );
}
